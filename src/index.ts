// ====================== РІВЕНЬ 1 ======================

type EntityId = string | number;

interface BaseProduct {
  readonly id: EntityId;
  title: string;
  price: number;
  description?: string;
  tags: string[];
  inStock: boolean;
}

/** Варіант 4 — Доставка їжі */
interface Product extends BaseProduct {
  weightGrams: number;
  calories: number;
  isSpicy: boolean;
  allergens: string[];
}

function createProduct(productData: Omit<Product, "id"> & { id?: EntityId }): Product {
  if (productData.price < 0) {
    throw new Error("Ціна не може бути від'ємною");
  }
  return {
    id: productData.id ?? crypto.randomUUID(),
    ...productData,
  };
}

function calculateLineTotal(
  price: number,
  quantity: number,
  discountPercent: number = 0
): number {
  if (price < 0 || quantity < 0) {
    throw new Error("Ціна та кількість не можуть бути від'ємними");
  }
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Знижка має бути від 0 до 100");
  }
  const total = price * quantity;
  return total * (1 - discountPercent / 100);
}

// ====================== РІВЕНЬ 2 ======================

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

/** Способи доставки Варіанту 4 */
type DeliveryMethod = "express_courier" | "scheduled_courier" | "takeaway";

interface CartItem {
  product: Product;
  quantity: number;
}

type TimestampMetadata = {
  readonly createdAt: Date;
  updatedAt: Date;
};

type Order = {
  readonly orderId: string;
  customerEmail: string;
  items: CartItem[];
  status: OrderStatus;
  delivery: DeliveryMethod;
} & TimestampMetadata;

function updateOrderStatus(order: Order, newStatus: OrderStatus): Order {
  if (order.status === "cancelled" || order.status === "delivered") {
    throw new Error(
      `Неможливо змінити статус замовлення зі стану "${order.status}"`
    );
  }
  return {
    ...order,
    status: newStatus,
    updatedAt: new Date(),
  };
}

function validateCustomerInput(input: unknown): string {
  if (typeof input !== "string") {
    throw new TypeError("Очікується рядок (email)");
  }
  const cleaned = input.trim();
  if (cleaned.length === 0) {
    throw new Error("Email не може бути порожнім");
  }
  if (!cleaned.includes("@")) {
    throw new Error("Email повинен містити символ @");
  }
  return cleaned;
}

// ====================== РІВЕНЬ 3 ======================

interface CreditCardPayment {
  type: "card";
  cardNumber: string;
  cardHolder: string;
  cvv: string;
}

interface CashOnDeliveryPayment {
  type: "cash";
  cashAmountToPay: number;
}

interface OnlineServicePayment {
  type: "online_service";
  serviceName: "ApplePay" | "GooglePay";
  transactionRef: string;
}

type PaymentDetails =
  | CreditCardPayment
  | CashOnDeliveryPayment
  | OnlineServicePayment;

function isCreditCardPayment(
  payment: PaymentDetails
): payment is CreditCardPayment {
  return payment.type === "card";
}

function maskCardNumber(payment: PaymentDetails): string {
  if (isCreditCardPayment(payment)) {
    const last4 = payment.cardNumber.slice(-4);
    return `**** **** **** ${last4}`;
  }
  return "Не вимагає маскування";
}

function processPayment(payment: PaymentDetails, amount: number): string {
  switch (payment.type) {
    case "card":
      return `Успішно списано ${amount} грн з картки платника ${payment.cardHolder}.`;
    case "cash":
      if (payment.cashAmountToPay > amount) {
        const change = payment.cashAmountToPay - amount;
        return `Оплата готівкою. Підготувати решту: ${change} грн.`;
      }
      return `Оплата точною сумою готівкою: ${amount} грн.`;
    case "online_service":
      return `Успішна авторизація через ${payment.serviceName}. Ref: ${payment.transactionRef}`;
    default: {
      const _exhaustiveCheck: never = payment;
      throw new Error(`Невідомий тип оплати: ${_exhaustiveCheck}`);
    }
  }
}

// ====================== ДЕМОНСТРАЦІЯ ======================

console.log("=== СИСТЕМА ОБРОБКИ ЗАМОВЛЕНЬ (E-COMMERCE CORE) ===\n");

// Каталог товарів (їжа)
const pizza = createProduct({
  title: "Піца Маргарита",
  price: 320,
  description: "Класична піца з моцарелою та базиліком",
  tags: ["pizza", "italian", "vegetarian"],
  inStock: true,
  weightGrams: 450,
  calories: 980,
  isSpicy: false,
  allergens: ["молочні продукти", "глютен"],
});

const burger = createProduct({
  title: "Бургер з яловичиною",
  price: 280,
  tags: ["burger", "meat"],
  inStock: true,
  weightGrams: 380,
  calories: 750,
  isSpicy: true,
  allergens: ["глютен", "яйце"],
});

const salad = createProduct({
  title: "Салат Цезар",
  price: 210,
  tags: ["salad", "healthy"],
  inStock: true,
  weightGrams: 280,
  calories: 420,
  isSpicy: false,
  allergens: ["молочні продукти", "яйце", "риба"],
});

console.log("[Каталог товарів]");
console.log(
  `- Створено товар #${pizza.id}: [${pizza.title}] - ${pizza.price} грн (В наявності: ${pizza.inStock ? "так" : "ні"})`
);
console.log(
  `  Характеристики: ${pizza.weightGrams} г, ${pizza.calories} ккал, Гострий: ${pizza.isSpicy ? "так" : "ні"}, Алергени: ${pizza.allergens.join(", ")}`
);
console.log(
  `- Створено товар #${burger.id}: [${burger.title}] - ${burger.price} грн (В наявності: ${burger.inStock ? "так" : "ні"})`
);
console.log(
  `  Характеристики: ${burger.weightGrams} г, ${burger.calories} ккал, Гострий: ${burger.isSpicy ? "так" : "ні"}, Алергени: ${burger.allergens.join(", ")}`
);
console.log(
  `- Створено товар #${salad.id}: [${salad.title}] - ${salad.price} грн (В наявності: ${salad.inStock ? "так" : "ні"})\n`
);

// Кошик
const cart: CartItem[] = [
  { product: pizza, quantity: 2 },
  { product: burger, quantity: 1 },
  { product: salad, quantity: 1 },
];

console.log("[Формування кошика]");
let total = 0;
cart.forEach((item, i) => {
  const line = calculateLineTotal(item.product.price, item.quantity);
  total += line;
  console.log(`${i + 1}. ${item.product.title} x ${item.quantity} = ${line} грн`);
});
console.log(`Загальна вартість замовлення: ${total} грн\n`);

// Замовлення
const email = validateCustomerInput("  customer@example.com  ");
const order: Order = {
  orderId: `ord-${Date.now()}-food`,
  customerEmail: email,
  items: cart,
  status: "pending",
  delivery: "express_courier",
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log("[Створення замовлення]");
console.log(`Замовлення ID: ${order.orderId}`);
console.log(`Клієнт: ${order.customerEmail}`);
console.log(`Доставка: ${order.delivery}`);
console.log(`Початковий статус: ${order.status}`);
console.log(`Час створення: ${order.createdAt.toISOString()}\n`);

// Зміна статусів
console.log("[Зміна життєвого циклу]");
let current = updateOrderStatus(order, "processing");
console.log(
  `Оновлення статусу: pending -> ${current.status} (Оновлено: ${current.updatedAt.toISOString()})`
);
current = updateOrderStatus(current, "shipped");
console.log(
  `Оновлення статусу: processing -> ${current.status} (Оновлено: ${current.updatedAt.toISOString()})\n`
);

// Оплата
const cardPayment: CreditCardPayment = {
  type: "card",
  cardNumber: "4111111111118821",
  cardHolder: "John Doe",
  cvv: "123",
};

console.log("[Процесинг платежу]");
console.log(`Метод оплати: ${cardPayment.type}`);
console.log(`Маскування: ${maskCardNumber(cardPayment)}`);
console.log(`Результат: ${processPayment(cardPayment, total)}`);

// Додаткові методи
console.log("\n--- Інші методи оплати ---");
const cash: CashOnDeliveryPayment = { type: "cash", cashAmountToPay: 1500 };
console.log(processPayment(cash, total));

const applePay: OnlineServicePayment = {
  type: "online_service",
  serviceName: "ApplePay",
  transactionRef: "AP-FOOD-998877",
};
console.log(processPayment(applePay, total));