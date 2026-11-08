import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import Blank from '../../components/blank/blank';
import { OrderModel } from '@shared/models/order.model';
import { ProductModel } from '@shared/models/product.model';
import { CategoryModel } from '@shared/models/category.model';
import { API_URL } from '../../constants';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiToastService } from 'flexi-toast';

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalItemsSold: number;
  avgItemsPerOrder: number;
  uniqueCustomers: number;
  totalProducts: number;
  totalCategories: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  cityDistribution: { city: string; count: number; revenue: number }[];
  districtDistribution: { district: string; city: string; count: number; revenue: number }[];
  installmentStats: { option: string; count: number; percentage: number }[];
  statusStats: { status: string; count: number; percentage: number }[];
  topCustomers: { name: string; orderCount: number; spent: number }[];
  categorySales: { categoryName: string; quantity: number; revenue: number }[];
  lowStockProducts: { name: string; stock: number; categoryName: string; price: number }[];
  unsoldProducts: { name: string; stock: number; categoryName: string; price: number }[];
  recentOrders: {
    orderNumber: string;
    fullName: string;
    city: string;
    district: string;
    date: Date;
    total: number;
    itemCount: number;
    installment: string;
  }[];
}

export interface AIRecommendation {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  priority: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [Blank, TrCurrencyPipe, DatePipe],
  templateUrl: './analytics.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AIAnalytics {
  readonly ordersResult = httpResource<OrderModel[]>(() => `${API_URL}/orders`);
  readonly productsResult = httpResource<ProductModel[]>(() => `${API_URL}/products`);
  readonly categoriesResult = httpResource<CategoryModel[]>(() => `${API_URL}/categories`);
  readonly usersResult = httpResource<unknown[]>(() => `${API_URL}/users`);

  readonly orders = computed(() => this.ordersResult.value() ?? []);
  readonly products = computed(() => this.productsResult.value() ?? []);
  readonly categories = computed(() => this.categoriesResult.value() ?? []);

  readonly loading = computed(
    () =>
      this.ordersResult.isLoading() ||
      this.productsResult.isLoading() ||
      this.categoriesResult.isLoading() ||
      this.usersResult.isLoading()
  );
  readonly analyzing = signal(false);
  readonly analysisResult = signal<{
    summary: AnalyticsSummary;
    recommendations: AIRecommendation[];
    report: string;
  } | null>(null);

  readonly #toast = inject(FlexiToastService);

  runAnalysis(): void {
    const orders = this.orders();
    if (orders.length === 0) {
      this.#toast.showToast(
        'Uyarı',
        'Analiz için sipariş verisi bulunamadı. Önce sipariş ekleyin.',
        'warning'
      );
      return;
    }

    this.analyzing.set(true);
    this.analysisResult.set(null);

    setTimeout(() => {
      const summary = this.computeSummary(orders, this.products(), this.categories());
      const recommendations = this.generateRecommendations(summary, orders);
      const report = this.generateReport(summary, recommendations);

      this.analysisResult.set({ summary, recommendations, report });
      this.analyzing.set(false);
      this.#toast.showToast(
        'Analiz Tamamlandı',
        'analiz başarıyla oluşturuldu.',
        'success'
      );
    }, 1500);
  }

  private orderTotal(order: OrderModel): number {
    return (order.baskets ?? []).reduce(
      (sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 1),
      0
    );
  }

  private orderItemCount(order: OrderModel): number {
    return (order.baskets ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  }

  private computeSummary(
    orders: OrderModel[],
    products: ProductModel[],
    categories: CategoryModel[]
  ): AnalyticsSummary {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    const cityMap = new Map<string, { count: number; revenue: number }>();
    const districtMap = new Map<
      string,
      { district: string; city: string; count: number; revenue: number }
    >();
    const installmentMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const categoryMap = new Map<string, { quantity: number; revenue: number }>();
    const customerMap = new Map<string, { name: string; orderCount: number; spent: number }>();
    const soldProductIds = new Set<string>();

    for (const order of orders) {
      const orderTotal = this.orderTotal(order);
      const itemCount = this.orderItemCount(order);

      totalRevenue += orderTotal;
      totalItemsSold += itemCount;

      for (const item of order.baskets ?? []) {
        const key = item.productName ?? item.productId ?? 'Bilinmeyen';
        const current = productMap.get(key) ?? { quantity: 0, revenue: 0 };
        current.quantity += item.quantity ?? 1;
        current.revenue += (item.productPrice ?? 0) * (item.quantity ?? 1);
        productMap.set(key, current);

        if (item.productId) {
          soldProductIds.add(item.productId);
        }

        const product = products.find((p) => p.id === item.productId);
        const categoryName = product?.categoryName ?? 'Bilinmeyen';
        const catCurrent = categoryMap.get(categoryName) ?? { quantity: 0, revenue: 0 };
        catCurrent.quantity += item.quantity ?? 1;
        catCurrent.revenue += (item.productPrice ?? 0) * (item.quantity ?? 1);
        categoryMap.set(categoryName, catCurrent);
      }

      const city = (order.city ?? 'Bilinmeyen').trim() || 'Bilinmeyen';
      const cityData = cityMap.get(city) ?? { count: 0, revenue: 0 };
      cityData.count++;
      cityData.revenue += orderTotal;
      cityMap.set(city, cityData);

      const district = (order.district ?? 'Bilinmeyen').trim() || 'Bilinmeyen';
      const districtKey = `${city}::${district}`;
      const districtData = districtMap.get(districtKey) ?? {
        district,
        city,
        count: 0,
        revenue: 0,
      };
      districtData.count++;
      districtData.revenue += orderTotal;
      districtMap.set(districtKey, districtData);

      const inst = order.installmentOptions ?? 'Tek çekim';
      installmentMap.set(inst, (installmentMap.get(inst) ?? 0) + 1);

      const status = order.status?.trim() || 'Belirsiz';
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);

      const customerKey = order.userId ?? order.fullName;
      const customer = customerMap.get(customerKey) ?? {
        name: order.fullName,
        orderCount: 0,
        spent: 0,
      };
      customer.orderCount++;
      customer.spent += orderTotal;
      customerMap.set(customerKey, customer);
    }

    const orderCount = orders.length;

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const cityDistribution = Array.from(cityMap.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const districtDistribution = Array.from(districtMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    const installmentStats = Array.from(installmentMap.entries())
      .map(([option, count]) => ({
        option,
        count,
        percentage: orderCount > 0 ? Math.round((count / orderCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const statusStats = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: orderCount > 0 ? Math.round((count / orderCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.spent - a.spent);

    const categorySales = Array.from(categoryMap.entries())
      .map(([categoryName, data]) => ({ categoryName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const lowStockProducts = products
      .filter((p) => (p.stock ?? 0) <= 15)
      .map((p) => ({
        name: p.name,
        stock: p.stock ?? 0,
        categoryName: p.categoryName ?? '-',
        price: p.price ?? 0,
      }))
      .sort((a, b) => a.stock - b.stock);

    const unsoldProducts = products
      .filter((p) => p.id && !soldProductIds.has(p.id))
      .map((p) => ({
        name: p.name,
        stock: p.stock ?? 0,
        categoryName: p.categoryName ?? '-',
        price: p.price ?? 0,
      }));

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((order) => ({
        orderNumber: order.orderNumber,
        fullName: order.fullName,
        city: order.city,
        district: order.district,
        date: new Date(order.date),
        total: this.orderTotal(order),
        itemCount: this.orderItemCount(order),
        installment: order.installmentOptions ?? 'Tek çekim',
      }));

    return {
      totalOrders: orderCount,
      totalRevenue,
      avgOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
      totalItemsSold,
      avgItemsPerOrder:
        orderCount > 0 ? Math.round((totalItemsSold / orderCount) * 10) / 10 : 0,
      uniqueCustomers: customerMap.size,
      totalProducts: products.length,
      totalCategories: categories.length,
      topProducts,
      cityDistribution,
      districtDistribution,
      installmentStats,
      statusStats,
      topCustomers,
      categorySales,
      lowStockProducts,
      unsoldProducts,
      recentOrders,
    };
  }

  private generateRecommendations(
    summary: AnalyticsSummary,
    orders: OrderModel[]
  ): AIRecommendation[] {
    const recs: AIRecommendation[] = [];

    if (summary.totalRevenue > 0) {
      recs.push({
        type: 'success',
        title: 'Satış Performansı',
        description: `Toplam ${summary.totalOrders} siparişten ₺${summary.totalRevenue.toLocaleString('tr-TR')} gelir elde edildi. Ortalama sipariş değeri ₺${summary.avgOrderValue.toLocaleString('tr-TR')}.`,
        priority: 1,
      });
    }

    recs.push({
      type: 'info',
      title: 'Sipariş Özeti',
      description: `Toplam ${summary.totalItemsSold} ürün satıldı. Sipariş başına ortalama ${summary.avgItemsPerOrder} ürün düştü. ${summary.uniqueCustomers} farklı müşteri sipariş verdi.`,
      priority: 2,
    });

    if (summary.topProducts.length > 0) {
      const top = summary.topProducts[0];
      recs.push({
        type: 'info',
        title: 'En Çok Satan Ürün',
        description: `"${top.name}" en yüksek geliri getiren ürün (${top.quantity} adet, ₺${top.revenue.toLocaleString('tr-TR')}). Stok ve pazarlama kampanyalarını güçlendirmeyi değerlendirin.`,
        priority: 3,
      });
    }

    if (summary.topProducts.length > 1) {
      const second = summary.topProducts[1];
      recs.push({
        type: 'tip',
        title: 'Ürün Paketi Önerisi',
        description: `"${summary.topProducts[0].name}" ve "${second.name}" birlikte en çok satılan ürünler. Bu ikili için paket indirimi veya çapraz satış kampanyası düşünülebilir.`,
        priority: 4,
      });
    }

    if (summary.topProducts[0] && summary.totalRevenue > 0) {
      const share = Math.round(
        (summary.topProducts[0].revenue / summary.totalRevenue) * 100
      );
      if (share > 50) {
        recs.push({
          type: 'warning',
          title: 'Gelir Yoğunlaşması',
          description: `Gelirin %${share}'si tek bir üründen geliyor. Portföy çeşitliliğini artırmak riski azaltır.`,
          priority: 5,
        });
      }
    }

    if (summary.cityDistribution.length > 0) {
      const topCity = summary.cityDistribution[0];
      recs.push({
        type: 'tip',
        title: 'Bölgesel Odak (İl)',
        description: `En fazla sipariş ${topCity.city} şehrinden (${topCity.count} sipariş, ₺${topCity.revenue.toLocaleString('tr-TR')}). Bu bölgeye özel kampanya veya lojistik optimizasyonu düşünülebilir.`,
        priority: 6,
      });
    }

    if (summary.districtDistribution.length > 0) {
      const topDistrict = summary.districtDistribution[0];
      recs.push({
        type: 'tip',
        title: 'Bölgesel Odak (İlçe)',
        description: `${topDistrict.city} / ${topDistrict.district} en yüksek sipariş yoğunluğuna sahip (${topDistrict.count} sipariş). Yerel teslimat veya mağaza ağı planlaması için öncelikli bölge olabilir.`,
        priority: 7,
      });
    }

    if (summary.categorySales.length > 0) {
      const topCat = summary.categorySales[0];
      recs.push({
        type: 'info',
        title: 'Kategori Performansı',
        description: `"${topCat.categoryName}" kategorisi en yüksek geliri üretti (${topCat.quantity} adet, ₺${topCat.revenue.toLocaleString('tr-TR')}). Bu kategoride yeni ürün ekleme veya stok artırımı değerlendirilebilir.`,
        priority: 8,
      });
    }

    const tekCekim = summary.installmentStats.find((s) =>
      s.option.toLowerCase().includes('tek')
    );
    if (tekCekim && tekCekim.count > summary.totalOrders * 0.5) {
      recs.push({
        type: 'info',
        title: 'Tek Çekim Tercihi',
        description: `Müşterilerin %${tekCekim.percentage}'si tek çekim tercih ediyor. Taksit seçeneklerini vurgulayan kampanyalar dönüşümü artırabilir.`,
        priority: 9,
      });
    }

    const taksit = summary.installmentStats.find(
      (s) => s.option.toLowerCase().includes('taksit')
    );
    if (taksit && taksit.percentage >= 30) {
      recs.push({
        type: 'info',
        title: 'Taksit Kullanımı',
        description: `%${taksit.percentage} sipariş taksitli ödeme ile yapıldı (${taksit.option}). Banka anlaşmaları ve taksit promosyonları satışları destekleyebilir.`,
        priority: 10,
      });
    }

    const belirsiz = summary.statusStats.find((s) =>
      s.status.toLowerCase().includes('belirsiz')
    );
    if (belirsiz && belirsiz.count > 0) {
      recs.push({
        type: 'warning',
        title: 'Sipariş Durumu Eksik',
        description: `${belirsiz.count} siparişin durumu belirsiz veya boş (%${belirsiz.percentage}). Sipariş takip sürecini netleştirmek operasyonel verimliliği artırır.`,
        priority: 11,
      });
    }

    const hazirlaniyor = summary.statusStats.find((s) =>
      s.status.toLowerCase().includes('hazırlanıyor')
    );
    if (hazirlaniyor && hazirlaniyor.count > 2) {
      recs.push({
        type: 'warning',
        title: 'Sipariş İşleme',
        description: `${hazirlaniyor.count} sipariş hâlâ hazırlanıyor. İşleme süresini kısaltmak müşteri memnuniyetini artırır.`,
        priority: 12,
      });
    }

    if (summary.avgOrderValue < 50000 && summary.totalOrders > 1) {
      recs.push({
        type: 'tip',
        title: 'Sepet Değeri Artırımı',
        description:
          'Ortalama sipariş değeri düşük. "Birlikte alın" önerileri, ücretsiz kargo eşiği veya paket indirimleri ile sepet değerini yükseltebilirsiniz.',
        priority: 13,
      });
    }

    if (summary.avgItemsPerOrder >= 5) {
      recs.push({
        type: 'success',
        title: 'Yüksek Sepet Adedi',
        description: `Sipariş başına ortalama ${summary.avgItemsPerOrder} ürün satılıyor. Müşteriler birden fazla ürün alma eğiliminde; paket ve set ürünler bu davranışı güçlendirebilir.`,
        priority: 14,
      });
    }

    const repeatCustomers = summary.topCustomers.filter((c) => c.orderCount >= 2);
    if (repeatCustomers.length > 0) {
      recs.push({
        type: 'success',
        title: 'Tekrar Eden Müşteriler',
        description: `${repeatCustomers.length} müşteri birden fazla sipariş verdi. Sadakat programı veya özel indirimler bu müşterileri elde tutabilir.`,
        priority: 15,
      });
    }

    if (summary.lowStockProducts.length > 0) {
      const critical = summary.lowStockProducts.filter((p) => p.stock <= 10);
      recs.push({
        type: 'warning',
        title: 'Düşük Stok Uyarısı',
        description: `${summary.lowStockProducts.length} ürünün stoku kritik seviyede (${critical.length} ürün 10 ve altı). "${summary.lowStockProducts[0].name}" stok: ${summary.lowStockProducts[0].stock}. Tedarik planını gözden geçirin.`,
        priority: 16,
      });
    }

    if (summary.unsoldProducts.length > 0) {
      recs.push({
        type: 'tip',
        title: 'Satılmayan Ürünler',
        description: `${summary.unsoldProducts.length} ürün henüz hiç satılmadı. Bu ürünler için indirim, vitrin veya reklam kampanyası önerilir.`,
        priority: 17,
      });
    }

    if (summary.topCustomers.length > 0) {
      const vip = summary.topCustomers[0];
      recs.push({
        type: 'info',
        title: 'En Değerli Müşteri',
        description: `"${vip.name}" toplam ₺${vip.spent.toLocaleString('tr-TR')} harcama yaptı (${vip.orderCount} sipariş). VIP müşteri programı veya kişisel teklifler düşünülebilir.`,
        priority: 18,
      });
    }

    if (summary.uniqueCustomers < summary.totalOrders) {
      const ratio = Math.round((summary.uniqueCustomers / summary.totalOrders) * 100);
      recs.push({
        type: 'info',
        title: 'Müşteri Sadakati',
        description: `Sipariş/müşteri oranı yüksek; müşteriler tekrar alışveriş yapıyor. Tekrar sipariş oranı yaklaşık %${100 - ratio} müşteri çeşitliliği gösteriyor.`,
        priority: 19,
      });
    }

    const maxOrder = orders.reduce(
      (max, o) => (this.orderTotal(o) > this.orderTotal(max) ? o : max),
      orders[0]
    );
    if (maxOrder) {
      recs.push({
        type: 'success',
        title: 'En Yüksek Sipariş',
        description: `En büyük sipariş: ${maxOrder.orderNumber} — ${maxOrder.fullName}, ₺${this.orderTotal(maxOrder).toLocaleString('tr-TR')}. Büyük sipariş veren müşterilere özel hizmet sunulabilir.`,
        priority: 20,
      });
    }

    recs.push({
      type: 'info',
      title: 'Genel Öneri',
      description:
        'Düzenli periyotlarla bu analizi çalıştırarak trendleri takip edin. Veri odaklı karar alma, satış ve operasyon verimliliğini artırır.',
      priority: 99,
    });

    return recs.sort((a, b) => a.priority - b.priority);
  }

  private generateReport(summary: AnalyticsSummary, recs: AIRecommendation[]): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════',
      '   RAPOR',
      '   E-Ticaret Sipariş Analizi',
      '═══════════════════════════════════════════════════════',
      '',
      '📊 ÖZET İSTATİSTİKLER',
      `   • Toplam Sipariş: ${summary.totalOrders}`,
      `   • Toplam Gelir: ₺${summary.totalRevenue.toLocaleString('tr-TR')}`,
      `   • Ortalama Sipariş: ₺${summary.avgOrderValue.toLocaleString('tr-TR')}`,
      `   • Satılan Ürün Adedi: ${summary.totalItemsSold}`,
      `   • Sipariş Başına Ürün: ${summary.avgItemsPerOrder}`,
      `   • Farklı Müşteri: ${summary.uniqueCustomers}`,
      `   • Katalog Ürün: ${summary.totalProducts}`,
      `   • Kategori: ${summary.totalCategories}`,
      '',
      '🏆 EN ÇOK SATAN ÜRÜNLER',
      ...summary.topProducts.slice(0, 10).map(
        (p, i) =>
          `   ${i + 1}. ${p.name}: ${p.quantity} adet, ₺${p.revenue.toLocaleString('tr-TR')}`
      ),
      '',
      '📍 İL BAZLI DAĞILIM',
      ...summary.cityDistribution.map(
        (c) => `   • ${c.city}: ${c.count} sipariş, ₺${c.revenue.toLocaleString('tr-TR')}`
      ),
      '',
      '📍 İLÇE BAZLI DAĞILIM',
      ...summary.districtDistribution.slice(0, 10).map(
        (d) =>
          `   • ${d.city} / ${d.district}: ${d.count} sipariş, ₺${d.revenue.toLocaleString('tr-TR')}`
      ),
      '',
      '📦 KATEGORİ SATIŞLARI',
      ...summary.categorySales.map(
        (c) =>
          `   • ${c.categoryName}: ${c.quantity} adet, ₺${c.revenue.toLocaleString('tr-TR')}`
      ),
      '',
      '💳 ÖDEME TERCİHLERİ',
      ...summary.installmentStats.map(
        (s) => `   • ${s.option}: ${s.count} sipariş (%${s.percentage})`
      ),
      '',
      '📋 SİPARİŞ DURUMLARI',
      ...summary.statusStats.map(
        (s) => `   • ${s.status}: ${s.count} sipariş (%${s.percentage})`
      ),
      '',
      '👤 EN İYİ MÜŞTERİLER',
      ...summary.topCustomers.slice(0, 5).map(
        (c) =>
          `   • ${c.name}: ${c.orderCount} sipariş, ₺${c.spent.toLocaleString('tr-TR')}`
      ),
      '',
      '💡 TAVSİYELER',
      ...recs.map((r) => `   [${r.type.toUpperCase()}] ${r.title}: ${r.description}`),
      '',
      '═══════════════════════════════════════════════════════',
      `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`,
      '═══════════════════════════════════════════════════════',
    ];
    return lines.join('\n');
  }

  refresh(): void {
    this.ordersResult.reload();
    this.productsResult.reload();
    this.categoriesResult.reload();
    this.usersResult.reload();
    this.analysisResult.set(null);
  }

  copyReport(report: string): void {
    navigator.clipboard.writeText(report).then(
      () => this.#toast.showToast('Kopyalandı', 'Rapor panoya kopyalandı.', 'success'),
      () => this.#toast.showToast('Hata', 'Kopyalama başarısız.', 'error')
    );
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'tip':
        return 'lightbulb';
      default:
        return 'analytics';
    }
  }
}
