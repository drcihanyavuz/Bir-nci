// supabase/functions/create-iyzico-checkout/index.ts
//
// İstemciden { package_id, buyer: { identityNumber, gsmNumber, city, address } }
// alır, pending bir payments satırı açar, iyzico "Pay with iyzico" (PWI)
// oturumunu başlatır ve dönen ödeme sayfası URL'ini istemciye döner.
//
// Not: iyzico, sanal ürünler (VIRTUAL) için shippingAddress istemiyor,
// ama buyer.identityNumber (TC kimlik no) ve billingAddress hâlâ zorunlu.
// Bu yüzden BuyInci.jsx'te satın almadan önce bu bilgileri topluyoruz.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { iyzicoRequest, corsHeaders } from '../_shared/iyzico.ts';

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Giriş yapmalısınız' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Geçersiz oturum' }), { status: 401, headers: jsonHeaders });
    }

    const { package_id, buyer } = await req.json();

    if (!package_id || !buyer?.identityNumber || !buyer?.gsmNumber || !buyer?.city || !buyer?.address) {
      return new Response(
        JSON.stringify({ error: 'Eksik bilgi: paket ve alıcı bilgileri gerekli' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('inci_packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      return new Response(JSON.stringify({ error: 'Paket bulunamadı' }), { status: 404, headers: jsonHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        amount_paid: pkg.price_try,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      return new Response(JSON.stringify({ error: paymentError.message }), { status: 500, headers: jsonHeaders });
    }

    const [name, ...surnameParts] = (profile?.full_name || 'Ad Soyad').split(' ');
    const surname = surnameParts.join(' ') || '-';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '85.34.78.112';

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/iyzico-callback`;

    const iyzicoResponse = await iyzicoRequest('/payment/pay-with-iyzico/initialize', {
      locale: 'tr',
      conversationId: payment.id,
      price: pkg.price_try,
      paidPrice: pkg.price_try,
      currency: 'TRY',
      basketId: payment.id,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id,
        name,
        surname,
        identityNumber: buyer.identityNumber,
        email: user.email,
        gsmNumber: buyer.gsmNumber,
        registrationAddress: buyer.address,
        city: buyer.city,
        country: 'Turkey',
        ip,
      },
      billingAddress: {
        address: buyer.address,
        contactName: `${name} ${surname}`,
        city: buyer.city,
        country: 'Turkey',
      },
      basketItems: [
        {
          id: pkg.id,
          price: pkg.price_try,
          name: pkg.name,
          category1: 'İnci',
          itemType: 'VIRTUAL',
        },
      ],
    });

    if (iyzicoResponse.status !== 'success') {
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
      return new Response(
        JSON.stringify({ error: iyzicoResponse.errorMessage || 'Ödeme başlatılamadı' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    await supabaseAdmin
      .from('payments')
      .update({ payment_provider_ref: iyzicoResponse.token })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({ paymentPageUrl: iyzicoResponse.payWithIyzicoPageUrl }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});
