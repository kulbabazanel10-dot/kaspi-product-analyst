import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  Calculator,
  ClipboardList,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  PackageCheck,
  Percent,
  ReceiptText,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import "./styles.css";

const DEFAULT_USD_TO_KZT = 500;
const DEFAULT_CNY_TO_KZT = 80;
const DEFAULT_CARGO_USD_PER_KG = 3.5;

const categories = [
  "Товары для дома",
  "Украшения",
  "Сумки",
  "Одежда",
  "Подарочные боксы",
  "Чехлы",
  "Другое",
];

const deliveryTypes = [
  { key: "city", label: "Город" },
  { key: "kz", label: "Казахстан" },
  { key: "express", label: "Express" },
];

const kaspiDeliveryRows = [
  { label: "до 1 000 тг", maxOrder: 1000, city: 49.14, kz: 49.14, express: 49.14 },
  { label: "от 1 000 до 3 000 тг", maxOrder: 3000, city: 149.14, kz: 149.14, express: 149.14 },
  { label: "от 3 000 до 5 000 тг", maxOrder: 5000, city: 199.14, kz: 199.14, express: 199.14 },
  { label: "от 5 000 до 10 000 тг", maxOrder: 10000, city: 699.14, kz: 799.14, express: 799.14 },
  { label: "до 5 кг", maxWeight: 5, city: 1099.14, kz: 1299.14, express: 1699.14 },
  { label: "5-15 кг", maxWeight: 15, city: 1349.14, kz: 1699.14, express: 1849.14 },
  { label: "15-30 кг", maxWeight: 30, city: 2299.14, kz: 3599.14, express: 3149.14 },
  { label: "30-60 кг", maxWeight: 60, city: 2899.14, kz: 5649.14, express: 3599.14 },
  { label: "60-100 кг", maxWeight: 100, city: 4149.14, kz: 8549.14, express: 5599.14 },
  { label: "свыше 100 кг", maxWeight: Infinity, city: 6449.14, kz: 11999.14, express: 8449.14 },
];

function parseKaspiUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const slug = parts.at(-1) || "";
    const name = decodeURIComponent(slug)
      .replace(/-\d+\/?$/, "")
      .replaceAll("-", " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      host: parsed.hostname,
      guessedName: name ? capitalize(name) : "",
      isKaspi: parsed.hostname.includes("kaspi.kz"),
    };
  } catch {
    return { host: "", guessedName: "", isKaspi: false };
  }
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function money(value) {
  if (!Number.isFinite(value)) return "0 тг";
  return `${Math.round(value).toLocaleString("ru-RU")} тг`;
}

function numberValue(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getKaspiDelivery(orderAmount, weightKg, type) {
  if (orderAmount <= 0) {
    return { fee: 0, row: "нет суммы заказа" };
  }

  const row =
    orderAmount < 10000
      ? kaspiDeliveryRows.find((item) => item.maxOrder && orderAmount <= item.maxOrder)
      : kaspiDeliveryRows.find((item) => item.maxWeight && weightKg <= item.maxWeight);

  return { fee: row ? row[type] : 0, row: row ? row.label : "не найдено" };
}

function scoreLabel(score) {
  if (score >= 75) return "Брать в тест";
  if (score >= 55) return "Можно тестировать осторожно";
  return "Пока не брать";
}

function App() {
  const [form, setForm] = useState({
    kaspiUrl:
      "https://kaspi.kz/shop/p/30319463-865644022-3-mm-prozrachnyi-37-38-141835272/",
    productName: "Прозрачные тапочки 37-38",
    category: "Одежда",
    kaspiPrice: "4990",
    competitorPrice: "",
    purchasePrice: "",
    yuanPrice: "14",
    yuanRate: String(DEFAULT_CNY_TO_KZT),
    weightKg: "0.5",
    usdRate: String(DEFAULT_USD_TO_KZT),
    cargoUsdPerKg: String(DEFAULT_CARGO_USD_PER_KG),
    kaspiFeePercent: "19",
    packagingCost: "100",
    kaspiDeliveryType: "express",
    deliveryOrderAmount: "",
    manualKaspiDelivery: "1507",
    targetMargin: "20",
    competitorCount: "8",
    reviewsCount: "30",
    supplierRating: "4.8",
    supplierSales: "100",
    notes: "Пример из ручного расчета: 4990 - 19% - закуп 14 юаней - карго - упаковка - доставка Kaspi.",
  });

  const parsedUrl = useMemo(() => parseKaspiUrl(form.kaspiUrl), [form.kaspiUrl]);
  const productName = form.productName || parsedUrl.guessedName || "Название товара";

  const result = useMemo(() => {
    const kaspiPrice = numberValue(form.kaspiPrice);
    const competitorPrice = numberValue(form.competitorPrice);
    const manualPurchasePrice = numberValue(form.purchasePrice);
    const yuanPurchasePrice = numberValue(form.yuanPrice) * numberValue(form.yuanRate);
    const purchasePrice = manualPurchasePrice || yuanPurchasePrice;
    const weightKg = numberValue(form.weightKg);
    const usdRate = numberValue(form.usdRate) || DEFAULT_USD_TO_KZT;
    const cargoUsdPerKg = numberValue(form.cargoUsdPerKg) || DEFAULT_CARGO_USD_PER_KG;
    const kaspiFeePercent = numberValue(form.kaspiFeePercent);
    const packagingCost = numberValue(form.packagingCost);
    const deliveryOrderAmount = numberValue(form.deliveryOrderAmount) || kaspiPrice;
    const deliveryAuto = getKaspiDelivery(deliveryOrderAmount, weightKg, form.kaspiDeliveryType);
    const manualDelivery = numberValue(form.manualKaspiDelivery);
    const kaspiDelivery = manualDelivery || deliveryAuto.fee;
    const competitorCount = numberValue(form.competitorCount);
    const reviewsCount = numberValue(form.reviewsCount);
    const supplierRating = numberValue(form.supplierRating);
    const supplierSales = numberValue(form.supplierSales);

    const kaspiFee = kaspiPrice * (kaspiFeePercent / 100);
    const cargo = weightKg * cargoUsdPerKg * usdRate;
    const costBeforeKaspi = purchasePrice + cargo + packagingCost;
    const totalCost = costBeforeKaspi + kaspiDelivery + kaspiFee;
    const profit = kaspiPrice - totalCost;
    const margin = kaspiPrice > 0 ? (profit / kaspiPrice) * 100 : 0;
    const targetMargin = numberValue(form.targetMargin) / 100;
    const suggestedPrice =
      1 - targetMargin - kaspiFeePercent / 100 > 0
        ? (costBeforeKaspi + kaspiDelivery) / (1 - targetMargin - kaspiFeePercent / 100)
        : 0;

    let score = 0;
    if (margin >= 35) score += 30;
    else if (margin >= 20) score += 22;
    else if (margin >= 10) score += 12;
    else if (margin > 0) score += 5;

    if (profit >= 1500) score += 14;
    else if (profit >= 700) score += 9;
    else if (profit >= 300) score += 5;

    if (competitorCount <= 5) score += 16;
    else if (competitorCount <= 12) score += 10;
    else if (competitorCount <= 25) score += 4;

    if (reviewsCount >= 50) score += 12;
    else if (reviewsCount >= 15) score += 8;
    else if (reviewsCount >= 3) score += 4;

    if (supplierRating >= 4.8) score += 12;
    else if (supplierRating >= 4.6) score += 8;
    else if (supplierRating >= 4.3) score += 3;

    if (supplierSales >= 100) score += 8;
    else if (supplierSales >= 30) score += 5;
    else if (supplierSales >= 10) score += 3;

    if (competitorPrice > 0 && kaspiPrice <= competitorPrice) score += 8;
    else if (competitorPrice > 0 && kaspiPrice <= competitorPrice * 1.08) score += 4;

    return {
      purchasePrice,
      yuanPurchasePrice,
      kaspiFee,
      cargo,
      packagingCost,
      deliveryAuto,
      kaspiDelivery,
      costBeforeKaspi,
      totalCost,
      profit,
      margin,
      suggestedPrice,
      score: Math.min(100, Math.max(0, Math.round(score))),
      decision: scoreLabel(score),
    };
  }, [form]);

  const copyText = `${productName}
Категория: ${form.category}
Ссылка Kaspi: ${form.kaspiUrl || "-"}
Цена на Kaspi: ${money(numberValue(form.kaspiPrice))}
Комиссия/налог Kaspi: ${money(result.kaspiFee)}
Закуп: ${money(result.purchasePrice)}
Карго: ${money(result.cargo)}
Упаковка: ${money(result.packagingCost)}
Доставка Kaspi: ${money(result.kaspiDelivery)}
Все расходы: ${money(result.totalCost)}
Маржа деньгами: ${money(result.profit)}
Маржа: ${Math.round(result.margin)}%
Решение: ${result.decision}`;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function fillDemo() {
    setForm({
      kaspiUrl:
        "https://kaspi.kz/shop/p/30319463-865644022-3-mm-prozrachnyi-37-38-141835272/",
      productName: "Прозрачные тапочки 37-38",
      category: "Одежда",
      kaspiPrice: "4990",
      competitorPrice: "",
      purchasePrice: "",
      yuanPrice: "14",
      yuanRate: "80",
      weightKg: "0.5",
      usdRate: "500",
      cargoUsdPerKg: "3.5",
      kaspiFeePercent: "19",
      packagingCost: "100",
      kaspiDeliveryType: "express",
      deliveryOrderAmount: "",
      manualKaspiDelivery: "1507",
      targetMargin: "20",
      competitorCount: "8",
      reviewsCount: "30",
      supplierRating: "4.8",
      supplierSales: "100",
      notes: "Получается примерно как в ручном расчете: маржа около 439-440 тг.",
    });
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Kaspi Магазин</p>
          <h1>Товар-Аналитик</h1>
        </div>
        <button className="ghost-button" onClick={fillDemo}>
          <Sparkles size={18} />
          Пример тапочек
        </button>
      </section>

      <section className="workspace">
        <div className="panel form-panel">
          <div className="section-title">
            <LinkIcon size={20} />
            <h2>Ссылка и данные товара</h2>
          </div>

          <label className="field wide">
            <span>Ссылка Kaspi</span>
            <input
              value={form.kaspiUrl}
              onChange={(event) => update("kaspiUrl", event.target.value)}
              placeholder="https://kaspi.kz/shop/p/..."
            />
          </label>

          {form.kaspiUrl && (
            <div className={parsedUrl.isKaspi ? "notice good" : "notice warn"}>
              {parsedUrl.isKaspi
                ? "Ссылка похожа на Kaspi. Название можно распознать из адреса, но цену лучше внести вручную."
                : "Проверьте ссылку: сейчас анализатор ожидает ссылку Kaspi."}
            </div>
          )}

          <div className="grid two">
            <label className="field">
              <span>Название</span>
              <input
                value={form.productName}
                onChange={(event) => update("productName", event.target.value)}
                placeholder={parsedUrl.guessedName || "Например: сумка багет"}
              />
            </label>

            <label className="field">
              <span>Категория</span>
              <select value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="subsection">
            <div className="mini-title">
              <Calculator size={18} />
              <h3>Продажа и закуп</h3>
            </div>
            <div className="grid three">
              <NumberField label="Цена Kaspi, тг" value={form.kaspiPrice} onChange={(value) => update("kaspiPrice", value)} />
              <NumberField label="Мин. конкурент, тг" value={form.competitorPrice} onChange={(value) => update("competitorPrice", value)} />
              <NumberField label="Закуп вручную, тг" value={form.purchasePrice} onChange={(value) => update("purchasePrice", value)} />
              <NumberField label="Цена 1688, юань" value={form.yuanPrice} onChange={(value) => update("yuanPrice", value)} />
              <NumberField label="Курс юаня, тг" value={form.yuanRate} onChange={(value) => update("yuanRate", value)} />
              <ReadOnlyField label="Закуп авто" value={money(result.yuanPurchasePrice)} />
            </div>
          </div>

          <div className="subsection">
            <div className="mini-title">
              <Truck size={18} />
              <h3>Доставка и расходы</h3>
            </div>
            <div className="grid three">
              <NumberField label="Вес, кг" value={form.weightKg} onChange={(value) => update("weightKg", value)} />
              <NumberField label="Карго, $/кг" value={form.cargoUsdPerKg} onChange={(value) => update("cargoUsdPerKg", value)} />
              <NumberField label="Курс доллара, тг" value={form.usdRate} onChange={(value) => update("usdRate", value)} />
              <NumberField label="Kaspi комиссия, %" value={form.kaspiFeePercent} onChange={(value) => update("kaspiFeePercent", value)} />
              <NumberField label="Упаковка, тг" value={form.packagingCost} onChange={(value) => update("packagingCost", value)} />
              <NumberField label="Сумма заказа для доставки" value={form.deliveryOrderAmount} onChange={(value) => update("deliveryOrderAmount", value)} />
              <label className="field">
                <span>Тип Kaspi доставки</span>
                <select
                  value={form.kaspiDeliveryType}
                  onChange={(event) => update("kaspiDeliveryType", event.target.value)}
                >
                  {deliveryTypes.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <ReadOnlyField label={`Авто Kaspi (${result.deliveryAuto.row})`} value={money(result.deliveryAuto.fee)} />
              <NumberField label="Факт доставка Kaspi, тг" value={form.manualKaspiDelivery} onChange={(value) => update("manualKaspiDelivery", value)} />
            </div>
            <p className="hint">
              Если поле “Факт доставка Kaspi” заполнено, калькулятор берет его. Если очистить поле, доставка считается по таблице с фото.
            </p>
          </div>

          <div className="subsection">
            <div className="mini-title">
              <Search size={18} />
              <h3>Спрос и поставщик</h3>
            </div>
            <div className="grid three">
              <NumberField label="Конкурентов" value={form.competitorCount} onChange={(value) => update("competitorCount", value)} />
              <NumberField label="Отзывы Kaspi" value={form.reviewsCount} onChange={(value) => update("reviewsCount", value)} />
              <NumberField label="Цель маржи, %" value={form.targetMargin} onChange={(value) => update("targetMargin", value)} />
              <NumberField label="Рейтинг поставщика" value={form.supplierRating} onChange={(value) => update("supplierRating", value)} />
              <NumberField label="Продаж поставщика" value={form.supplierSales} onChange={(value) => update("supplierSales", value)} />
            </div>
          </div>

          <label className="field wide">
            <span>Заметки</span>
            <textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Размеры, цвета, упаковка, что проверить у поставщика..."
            />
          </label>
        </div>

        <div className="side">
          <div className="panel score-panel">
            <div className="score-head">
              <div>
                <p className="eyebrow">Решение</p>
                <h2>{result.decision}</h2>
              </div>
              <div className="score-circle">{result.score}</div>
            </div>
            <div className="progress">
              <span style={{ width: `${result.score}%` }} />
            </div>
            <p className="hint">
              Оценка учитывает уже все основные расходы: комиссию Kaspi, закуп, карго, упаковку и доставку Kaspi.
            </p>
          </div>

          <div className="panel metrics">
            <Metric icon={<Percent size={18} />} label="Комиссия Kaspi" value={money(result.kaspiFee)} />
            <Metric icon={<PackageCheck size={18} />} label="Закуп" value={money(result.purchasePrice)} />
            <Metric icon={<Truck size={18} />} label="Карго" value={money(result.cargo)} />
            <Metric icon={<ReceiptText size={18} />} label="Доставка Kaspi" value={money(result.kaspiDelivery)} />
            <Metric icon={<Calculator size={18} />} label="Все расходы" value={money(result.totalCost)} />
            <Metric icon={<TrendingUp size={18} />} label="Маржа деньгами" value={money(result.profit)} />
            <Metric icon={<BadgeCheck size={18} />} label="Маржа %" value={`${Math.round(result.margin)}%`} />
          </div>

          <div className="panel">
            <div className="section-title">
              <Store size={20} />
              <h2>Рекомендация цены</h2>
            </div>
            <p className="price-big">{money(result.suggestedPrice)}</p>
            <p className="hint">
              Цена рассчитана так, чтобы после комиссии Kaspi и всех расходов осталась целевая маржа.
            </p>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <div className="section-title">
            <ClipboardList size={20} />
            <h2>Расчет как в тетради</h2>
          </div>
          <div className="copy-box">
            <p className="product-title">{productName}</p>
            <p>
              {money(numberValue(form.kaspiPrice))} - {money(result.kaspiFee)} комиссия Kaspi -{" "}
              {money(result.purchasePrice)} закуп - {money(result.cargo)} карго -{" "}
              {money(result.packagingCost)} упаковка - {money(result.kaspiDelivery)} доставка Kaspi ={" "}
              <strong>{money(result.profit)}</strong>
            </p>
            <p>
              Таблица Kaspi дала: {money(result.deliveryAuto.fee)} ({result.deliveryAuto.row}). Сейчас в расчете
              используется: {money(result.kaspiDelivery)}.
            </p>
          </div>
          <button className="primary-button" onClick={() => navigator.clipboard.writeText(copyText)}>
            <Copy size={18} />
            Скопировать анализ
          </button>
        </div>

        <div className="panel">
          <div className="section-title">
            <Search size={20} />
            <h2>Что проверить перед закупом</h2>
          </div>
          <ul className="check-list">
            <li>Проверьте фактическую доставку Kaspi в кабинете, если она отличается от таблицы.</li>
            <li>Сравните цену с конкурентами и убедитесь, что маржа деньгами не слишком маленькая.</li>
            <li>Проверьте рейтинг 1688/Таобао, реальные продажи, фото отзывов и размерную сетку.</li>
            <li>Для одежды и обуви учитывайте риск возврата, размеры и упаковку.</li>
            <li>Если маржа меньше 700-1000 тг, товар лучше тестировать очень осторожно.</li>
          </ul>
          {form.kaspiUrl && (
            <a className="link-button" href={form.kaspiUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
              Открыть товар
            </a>
          )}
        </div>
      </section>
    </main>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
