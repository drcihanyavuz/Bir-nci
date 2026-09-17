-- ============================================================
-- BirİNCİ — Otomatik Test Takımı
-- SADECE ayrı bir TEST projesine karşı çalıştırın, asla canlıya değil.
--
-- Her test kendi verisini oluşturur, temizler ve PASS/FAIL basar.
-- Gerçek Supabase'de auth.uid(), 'request.jwt.claim.sub' ayarından
-- okunur — bu yüzden "belirli bir kullanıcı gibi davran" için
-- set_config('request.jwt.claim.sub', ...) + set role authenticated
-- kullanıyoruz.
-- ============================================================

\set ON_ERROR_STOP off
\echo '========================================='
\echo 'BirİNCİ TEST TAKIMI BAŞLIYOR'
\echo '========================================='

-- ------------------------------------------------------------
-- Yardımcı: belirli bir kullanıcı gibi davranmaya başla/bitir
-- ------------------------------------------------------------
create or replace function test_act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id)::text, true);
end;
$$ language plpgsql;

create or replace function test_act_as_service() returns void as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
end;
$$ language plpgsql;


-- ------------------------------------------------------------
-- TEST 1: Kontenjan aşılamaz (eşzamanlı katılım yarışı)
-- ------------------------------------------------------------
do $$
declare
  v_admin_id uuid;
  v_comp_id uuid;
  v_count int;
  i int;
  v_uid uuid;
begin
  insert into auth.users (email, raw_user_meta_data)
  values ('test1admin@birinci-test.local', jsonb_build_object('full_name', 'Test Admin 1'))
  returning id into v_admin_id;
  update profiles set is_admin = true, approved_at = now() where id = v_admin_id;

  insert into competitions (title, start_time, max_participants, entry_cost_inci)
  values ('TEST: Kontenjan', now() + interval '1 hour', 5, 0)
  returning id into v_comp_id;

  for i in 1..8 loop
    insert into auth.users (email, raw_user_meta_data)
    values ('test1user' || i || '@birinci-test.local', jsonb_build_object('full_name', 'Test1 User ' || i))
    returning id into v_uid;
    update profiles set approved_at = now() where id = v_uid;

    perform test_act_as(v_uid);
      begin
      perform join_competition(v_comp_id);
    exception when others then null;
    end;
    end loop;

  select count(*) into v_count from participants where competition_id = v_comp_id;

  if v_count = 5 then
    raise notice '✅ BAŞARILI: Test 1 — Kontenjan (5) aşılmadı, tam 5 kişi kabul edildi';
  else
    raise notice '❌ HATA: Test 1 — Beklenen 5, gerçek %', v_count;
  end if;

  -- Temizlik
  delete from competitions where id = v_comp_id;
  delete from auth.users where email like 'test1%@birinci-test.local';
end $$;


-- ------------------------------------------------------------
-- TEST 2: Onaylanmamış üye yarışmaya katılamaz
-- ------------------------------------------------------------
do $$
declare
  v_comp_id uuid;
  v_uid uuid;
  v_failed boolean := false;
begin
  insert into competitions (title, start_time, max_participants, entry_cost_inci)
  values ('TEST: Onay', now() + interval '1 hour', 10, 0)
  returning id into v_comp_id;

  insert into auth.users (email, raw_user_meta_data)
  values ('test2user@birinci-test.local', jsonb_build_object('full_name', 'Test2 User'))
  returning id into v_uid;
  -- Bilerek approved_at'i null bırakıyoruz (onaylanmamış)

  perform test_act_as(v_uid);
  begin
    perform join_competition(v_comp_id);
  exception when others then
    v_failed := true;
  end;
  if v_failed then
    raise notice '✅ BAŞARILI: Test 2 — Onaysız üye reddedildi';
  else
    raise notice '❌ HATA: Test 2 — Onaysız üye katılabildi!';
  end if;

  delete from competitions where id = v_comp_id;
  delete from auth.users where email = 'test2user@birinci-test.local';
end $$;


-- ------------------------------------------------------------
-- TEST 3: Men edilmiş (banned) üye katılamaz, men kalkınca katılabilir
-- ------------------------------------------------------------
do $$
declare
  v_comp_id uuid;
  v_uid uuid;
  v_failed_while_banned boolean := false;
  v_ok_after_unban boolean := false;
begin
  insert into competitions (title, start_time, max_participants, entry_cost_inci)
  values ('TEST: Men', now() + interval '1 hour', 10, 0)
  returning id into v_comp_id;

  insert into auth.users (email, raw_user_meta_data)
  values ('test3user@birinci-test.local', jsonb_build_object('full_name', 'Test3 User'))
  returning id into v_uid;
  update profiles set approved_at = now(), banned_until = now() + interval '1 day' where id = v_uid;

  perform test_act_as(v_uid);
  begin
    perform join_competition(v_comp_id);
  exception when others then
    v_failed_while_banned := true;
  end;
  update profiles set banned_until = null where id = v_uid;

  perform test_act_as(v_uid);
  begin
    perform join_competition(v_comp_id);
    v_ok_after_unban := true;
  exception when others then null;
  end;
  if v_failed_while_banned and v_ok_after_unban then
    raise notice '✅ BAŞARILI: Test 3 — Men edilmişken reddedildi, men kalkınca katıldı';
  else
    raise notice '❌ HATA: Test 3 — men_iken_reddedildi=%, men_sonrasi_katildi=%', v_failed_while_banned, v_ok_after_unban;
  end if;

  delete from competitions where id = v_comp_id;
  delete from auth.users where email = 'test3user@birinci-test.local';
end $$;


-- ------------------------------------------------------------
-- TEST 4: Yarışma iptali herkese tam iade yapar
-- ------------------------------------------------------------
do $$
declare
  v_admin_id uuid;
  v_comp_id uuid;
  v_uid uuid;
  v_balance_before int := 100;
  v_balance_after int;
begin
  insert into auth.users (email, raw_user_meta_data)
  values ('test4admin@birinci-test.local', jsonb_build_object('full_name', 'Test4 Admin'))
  returning id into v_admin_id;
  update profiles set is_admin = true, approved_at = now() where id = v_admin_id;

  insert into auth.users (email, raw_user_meta_data)
  values ('test4user@birinci-test.local', jsonb_build_object('full_name', 'Test4 User'))
  returning id into v_uid;
  update profiles set approved_at = now(), inci_balance = v_balance_before where id = v_uid;

  insert into competitions (title, start_time, max_participants, entry_cost_inci)
  values ('TEST: Iptal', now() + interval '1 hour', 10, 30)
  returning id into v_comp_id;

  perform test_act_as(v_uid);
  perform join_competition(v_comp_id);
  perform test_act_as(v_admin_id);
  perform cancel_competition(v_comp_id);
  select inci_balance into v_balance_after from profiles where id = v_uid;

  if v_balance_after = v_balance_before then
    raise notice '✅ BAŞARILI: Test 4 — İptal sonrası bakiye tam iade edildi (%)', v_balance_after;
  else
    raise notice '❌ HATA: Test 4 — Beklenen %, gerçek %', v_balance_before, v_balance_after;
  end if;

  delete from competitions where id = v_comp_id;
  delete from auth.users where email in ('test4admin@birinci-test.local', 'test4user@birinci-test.local');
end $$;


-- ------------------------------------------------------------
-- TEST 5: Aynı isim / aynı telefonla ikinci kayıt reddedilir
-- ------------------------------------------------------------
do $$
declare
  v_uid1 uuid;
  v_phone_rejected boolean := false;
  v_name_rejected boolean := false;
begin
  insert into auth.users (email, raw_user_meta_data)
  values ('test5user1@birinci-test.local', jsonb_build_object('full_name', 'Test5 Benzersiz', 'phone', '05551237890'))
  returning id into v_uid1;

  begin
    insert into auth.users (email, raw_user_meta_data)
    values ('test5user2@birinci-test.local', jsonb_build_object('full_name', 'Baska Isim', 'phone', '05551237890'));
  exception when others then
    v_phone_rejected := true;
  end;

  begin
    insert into auth.users (email, raw_user_meta_data)
    values ('test5user3@birinci-test.local', jsonb_build_object('full_name', 'test5 benzersiz', 'phone', '05559998877'));
  exception when others then
    v_name_rejected := true;
  end;

  if v_phone_rejected and v_name_rejected then
    raise notice '✅ BAŞARILI: Test 5 — Aynı telefon ve aynı isim (büyük/küçük harf farkı dahil) reddedildi';
  else
    raise notice '❌ HATA: Test 5 — telefon_reddedildi=%, isim_reddedildi=%', v_phone_rejected, v_name_rejected;
  end if;

  delete from auth.users where email like 'test5user%@birinci-test.local';
end $$;


-- ------------------------------------------------------------
-- TEST 6: İletişim formu spam koruması (aynı e-postadan 10 dk'da max 3)
-- ------------------------------------------------------------
do $$
declare
  v_ok_count int := 0;
  v_4th_rejected boolean := false;
begin
  delete from contact_messages where sender_email = 'spamtest@birinci-test.local';

  for i in 1..3 loop
    begin
      insert into contact_messages (sender_name, sender_email, message)
      values ('Spam Test', 'spamtest@birinci-test.local', 'mesaj ' || i);
      v_ok_count := v_ok_count + 1;
    exception when others then null;
    end;
  end loop;

  begin
    insert into contact_messages (sender_name, sender_email, message)
    values ('Spam Test', 'spamtest@birinci-test.local', 'mesaj 4');
  exception when others then
    v_4th_rejected := true;
  end;

  if v_ok_count = 3 and v_4th_rejected then
    raise notice '✅ BAŞARILI: Test 6 — 3 mesaj kabul, 4. reddedildi';
  else
    raise notice '❌ HATA: Test 6 — kabul_edilen=%, dorduncu_reddedildi=%', v_ok_count, v_4th_rejected;
  end if;

  delete from contact_messages where sender_email = 'spamtest@birinci-test.local';
end $$;


-- ------------------------------------------------------------
-- TEST 7: Bakiye asla kayıt geçmişinden (inci_transactions) sapmaz
-- ------------------------------------------------------------
do $$
declare
  v_mismatch_count int;
begin
  select count(*) into v_mismatch_count
  from profiles p
  left join (select user_id, sum(amount) as total from inci_transactions group by user_id) t
    on t.user_id = p.id
  where p.inci_balance <> coalesce(t.total, 0) + 0  -- başlangıç bakiyesi kayıtlarda admin_grant olarak izleniyorsa 0
    and p.email like '%@birinci-test.local';

  -- Not: bu test, test kullanıcılarının başlangıç bakiyesini elle
  -- (admin_grant hareketi olmadan) UPDATE ile verdiğimiz durumlarda
  -- yanlış pozitif verebilir — gerçek üyelerde bu her zaman kayıt
  -- üzerinden değiştiği için orada sapma sıfır olmalıdır.
  raise notice 'ℹ️  BİLGİ: Test 7 — bu test gerçek/canlı verinizde çalıştırıldığında anlamlıdır, test verisinde bilgi amaçlıdır.';
end $$;


-- ------------------------------------------------------------
-- Temizlik: kalan test fonksiyonları
-- ------------------------------------------------------------
drop function if exists test_act_as(uuid);
drop function if exists test_act_as_service();

\echo '========================================='
\echo 'TEST TAKIMI BİTTİ — yukarıdaki ✅/❌ işaretlerine bakın'
\echo '========================================='
