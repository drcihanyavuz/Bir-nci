# BirİNCİ — Otomatik Test Takımı

Bu klasördeki SQL dosyaları, uygulamanın en kritik iş mantığını
(kontenjan yarışı, yarışma akışı, ödeme/inci bütünlüğü, güvenlik
kuralları) gerçek bir veritabanına karşı test eder.

## ÖNEMLİ: ASLA canlı (production) veritabanınıza karşı çalıştırmayın

Bu testler kendi test verilerini oluşturup üzerinde işlem yapar.
Yanlışlıkla gerçek üyeleriniz/verileriniz üzerinde çalışırsa risklidir.

## Nasıl kurulur (bir kere yapılır)

1. Supabase'de **ikinci, ayrı bir proje** oluşturun (ücretsiz plan
   yeterli) — adını örn. "BirİNCİ-TEST" koyun.
2. O projenin SQL Editor'ünde, gerçek projenizde çalıştırdığınız
   TÜM migration dosyalarını (001'den en sonuncusuna kadar) sırayla
   çalıştırın — böylece test projesi, gerçek projenizle aynı yapıya
   sahip olur.
3. O projenin Settings → Database kısmından "Connection string"i
   alın (URI formatında).

## Nasıl çalıştırılır

Her yeni özellik eklendiğinde ya da "acaba bir şeyi bozdum mu"
diye merak ettiğinizde:

```
psql "buraya_test_projesinin_connection_string'i" -f tests/run_all.sql
```

Çıktıda her test için ✅ BAŞARILI ya da ❌ HATA yazacak. Hepsi
✅ ise sistem sağlam demektir.

Bu dosyayı bana da gönderip "şunu çalıştır" diyebilirsiniz — ben de
gelecekteki bir oturumda bu dosyaları okuyup aynı testleri tekrar
kurup çalıştırabilirim.
