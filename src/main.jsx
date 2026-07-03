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
  Search,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import "./styles.css";

const USD_TO_KZT = 470;
const CARGO_USD_PER_KG = 3.5;

const categories = [
  "Товары для дома",
  "Украшения",
  "Сумки",
  "Одежда",
  "Подарочные боксы",
  "Чехлы",
  "Другое",
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

function scoreLabel(score) {
  if (score >= 75) return "Брать в тест";
  if (score >= 55) return "Можно тестировать осторожно";
  return "Пока не брать";
}

function App() {
  const [form, setForm] = useState({
    kaspiUrl: "",
    productName: "",
    category: categories[0],
    kaspiPrice: "",
    competitorPrice: "",
    purchasePrice: "",
    weightKg: "",
    targetMargin: "35",
    competitorCount: "8",
    reviewsCount: "30",
    supplierRating: "4.8",
    supplierSales: "100",
    notes: "",
  });

  const parsedUrl = useMemo(() => parseKaspiUrl(form.kaspiUrl), [form.kaspiUrl]);
  const productName = form.productName || parsedUrl.guessedName || "Название товара";

  const result = useMemo(() => {
    const kaspiPrice = numberValue(form.kaspiPrice);
    const competitorPrice = numberValue(form.competitorPrice);
    const purchasePrice = numberValue(form.purchasePrice);
    const weightKg = numberValue(form.weightKg);
    const competitorCount = numberValue(form.competitorCount);
    const reviewsCount = numberValue(form.reviewsCount);
    const supplierRating = numberValue(form.supplierRating);
    const supplierSales = numberValue(form.supplierSales);

    const cargo = weightKg * CARGO_USD_PER_KG * USD_TO_KZT;
    const landedCost = purchasePrice + cargo;
    const profit = kaspiPrice - landedCost;
    const margin = kaspiPrice > 0 ? (profit / kaspiPrice) * 100 : 0;
    const suggestedPrice = landedCost / (1 - numberValue(form.targetMargin) / 100);

    let score = 0;
    if (margin >= 40) score += 28;
    else if (margin >= 30) score += 22;
    else if (margin >= 20) score += 12;

    if (competitorCount <= 5) score += 18;
    else if (competitorCount <= 12) score += 12;
    else if (competitorCount <= 25) score += 5;

    if (reviewsCount >= 50) score += 16;
    else if (reviewsCount >= 15) score += 10;
    else if (reviewsCount >= 3) score += 5;

    if (supplierRating >= 4.8) score += 14;
    else if (supplierRating >= 4.6) score += 9;
    else if (supplierRating >= 4.3) score += 4;

    if (supplierSales >= 100) score += 12;
    else if (supplierSales >= 30) score += 8;
    else if (supplierSales >= 10) score += 4;

    if (competitorPrice > 0 && kaspiPrice <= competitorPrice) score += 12;
    else if (competitorPrice > 0 && kaspiPrice <= competitorPrice * 1.08) score += 7;

    return {
      cargo,
      landedCost,
      profit,
      margin,
      suggestedPrice,
      score: Math.min(100, Math.round(score)),
      decision: scoreLabel(score),
    };
  }, [form]);

  const copyText = `${productName}
Категория: ${form.category}
Ссылка Kaspi: ${form.kaspiUrl || "-"}
Цена на Kaspi: ${money(numberValue(form.kaspiPrice))}
Себестоимость с карго: ${money(result.landedCost)}
Прибыль: ${money(result.profit)}
Маржа: ${Math.round(result.margin)}%
Решение: ${result.decision}
Описание: Стильный и практичный товар для ежедневного использования. Подходит для подарка и личного применения. Перед отправкой проверяем качество и комплектацию.`;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function fillDemo() {
    setForm({
      kaspiUrl: "https://kaspi.kz/shop/p/organizer-dlja-kuhni-prozrachnyi-123456789/",
      productName: "Органайзер для кухни прозрачный",
      category: "Товары для дома",
      kaspiPrice: "5490",
      competitorPrice: "5990",
      purchasePrice: "1450",
      weightKg: "0.35",
      targetMargin: "35",
      competitorCount: "7",
      reviewsCount: "44",
      supplierRating: "4.9",
      supplierSales: "260",
      notes: "Проверить, есть ли разные размеры и наборы 2/4 штуки.",
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
          Пример
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

          <div className="grid three">
            <NumberField label="Цена Kaspi, тг" value={form.kaspiPrice} onChange={(value) => update("kaspiPrice", value)} />
            <NumberField label="Мин. конкурент, тг" value={form.competitorPrice} onChange={(value) => update("competitorPrice", value)} />
            <NumberField label="Закуп, тг" value={form.purchasePrice} onChange={(value) => update("purchasePrice", value)} />
            <NumberField label="Вес, кг" value={form.weightKg} onChange={(value) => update("weightKg", value)} />
            <NumberField label="Конкурентов" value={form.competitorCount} onChange={(value) => update("competitorCount", value)} />
            <NumberField label="Отзывы Kaspi" value={form.reviewsCount} onChange={(value) => update("reviewsCount", value)} />
            <NumberField label="Рейтинг поставщика" value={form.supplierRating} onChange={(value) => update("supplierRating", value)} />
            <NumberField label="Продаж поставщика" value={form.supplierSales} onChange={(value) => update("supplierSales", value)} />
            <NumberField label="Цель маржи, %" value={form.targetMargin} onChange={(value) => update("targetMargin", value)} />
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
              Оценка учитывает маржу, конкуренцию, отзывы, цену конкурента и надежность поставщика.
            </p>
          </div>

          <div className="panel metrics">
            <Metric icon={<Calculator size={18} />} label="Карго" value={money(result.cargo)} />
            <Metric icon={<PackageCheck size={18} />} label="Себестоимость" value={money(result.landedCost)} />
            <Metric icon={<TrendingUp size={18} />} label="Прибыль" value={money(result.profit)} />
            <Metric icon={<BadgeCheck size={18} />} label="Маржа" value={`${Math.round(result.margin)}%`} />
          </div>

          <div className="panel">
            <div className="section-title">
              <Store size={20} />
              <h2>Рекомендация цены</h2>
            </div>
            <p className="price-big">{money(result.suggestedPrice)}</p>
            <p className="hint">Цена рассчитана по целевой марже. Сравните ее с минимальной ценой конкурента.</p>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <div className="section-title">
            <ClipboardList size={20} />
            <h2>Текст для карточки</h2>
          </div>
          <div className="copy-box">
            <p className="product-title">{productName}</p>
            <p>
              Практичный товар из категории “{form.category}”. Подходит для личного использования,
              подарка и ежедневных задач. Перед отправкой проверяем качество, комплектацию и внешний вид.
            </p>
            <p>
              Ключевые слова: {productName.toLowerCase()}, подарок, для дома, стильный аксессуар,
              удобный товар.
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
            <li>Есть ли у товара 15+ отзывов или видимый спрос на Kaspi.</li>
            <li>Можно ли сделать цену не выше конкурента и сохранить маржу 30%+.</li>
            <li>Есть ли у поставщика рейтинг 4.6+ и реальные продажи.</li>
            <li>Не тяжелый ли товар: карго сейчас считается по 3.5 $/кг.</li>
            <li>Есть ли варианты цвета, размера или наборы для расширения карточки.</li>
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
