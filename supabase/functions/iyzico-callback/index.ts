// supabase/functions/iyzico-callback/index.ts
//
// iyzico, kullanıcıyı ödeme sonrası bu URL'e (form POST ile, "token" alanında)
// yönlendirir. Biz bu token'la iyzico'nun "Retrieve" endpoint'ini çağırıp
// ödemenin GERÇEKTEN başarılı olduğunu sunucu tarafında doğruluyoruz —
// tarayıcıdan gelen bilgiye asla güvenmiyoruz, sadece token'ı kullanıp
// sonucu iyzico'dan tekrar sorguluyoruz.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { iyzicoRequest } from '../_shared/iyzico.ts';

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const siteUrl = Deno.env.get('SITE_URL')!; // örn: https://birinci.vercel.app

  try {
    const contentType = req.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      token = form.get('token') as string | null;
    } else {
      const body = await req.json().catch(() => ({}));
      token = body.token ?? null;
    }

    if (!token) {
      return redirect(`${siteUrl}/buy-inci?status=error&reason=no_token`);
    }

    const result = await iyzicoRequest('/payment/iyzipos/checkoutform/auth/ecom/detail', {
      locale: 'tr',
      token,
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // basketId, initialize adımında payment.id olarak gönderilmişti
    const paymentId = result.basketId;

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*, inci_packages(inci_amount)')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return redirect(`${siteUrl}/buy-inci?status=error&reason=payment_not_found`);
    }

    // Zaten işlenmişse (aynı callback iki kere gelirse) tekrar bakiye ekleme
    if (payment.status === 'completed') {
      return redirect(`${siteUrl}/buy-inci?status=success`);
    }

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);
      return redirect(`${siteUrl}/buy-inci?status=failed`);
    }

    // Ödeme gerçekten başarılı: bakiyeyi artır + denetim izi kaydı + payment'ı tamamla.
    // Bu üç işlem idealde tek bir transaction'da olmalı; Supabase JS client'ı
    // henüz çoklu tablo transaction'ı desteklemediği için burada sırayla
    // yapıyoruz (ileride bir Postgres fonksiyonuna taşınabilir).
    const inciAmount = payment.inci_packages.inci_amount;

    await supabaseAdmin
      .from('payments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', paymentId);

    await supabaseAdmin.rpc('credit_inci_balance', {
      p_user_id: payment.user_id,
      p_amount: inciAmount,
      p_related_competition_id: null,
    });

    return redirect(`${siteUrl}/buy-inci?status=success`);
  } catch (err) {
    console.error(err);
    return redirect(`${siteUrl}/buy-inci?status=error`);
  }
});
