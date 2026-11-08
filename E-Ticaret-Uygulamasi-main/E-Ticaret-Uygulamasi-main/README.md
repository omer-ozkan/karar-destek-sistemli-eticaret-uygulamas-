#  E-Ticaret Uygulaması – Angular + NX Monorepo

Bu proje, Angular ve NX monorepo mimarisi ile geliştirilen, ölçeklenebilir bir e-ticaret platformudur. Uygulama, hem kullanıcıya yönelik bir e-ticaret arayüzünü (`ui`) hem de ürün ve sipariş yönetimini sağlayan bir admin panelini (`admin`) aynı monorepo çatısı altında barındırır.

Proje, Angular Flex Layout ile responsive, modern ve yönetilebilir bir frontend mimarisi sunar.

##  Özellikler
- NX monorepo yapısı
- Admin panel ve kullanıcı arayüzü
- Flex Layout ile responsive tasarım
- Reusable component ve servis mimarisi
- Gelişmiş modüler yapı (feature modules korunmuştur)

##  Kurulum
```bash
git clone https://github.com/kullaniciadi/E-Ticaret-Uygulamasi.git
cd eticaret
npm install
nx serve ui
nx serve admin
json-server db.json
