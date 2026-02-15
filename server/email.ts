type EmailHistory = {
  id: string;
  to: string;
  subject: string;
  template: string;
  sentAt: string;
  status: "Sent" | "Resent" | "Failed";
  createdAt?: string;
};

type OrderEmailData = {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  price: string;
  cargo?: string;
  date: string;
  total?: string;
};

type LowStockData = {
  name: string;
  quantity: number;
  category: string;
  price: string;
};

export class EmailService {
  constructor(private brandName: string, private supportEmail: string, private supportPhone: string) {}

  orderConfirmationTemplate(order: OrderEmailData) {
    return {
      subject: `Order Confirmed - #${order.id.slice(-6)} - ${this.brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2>Order Confirmed</h2>
          <p>Dear ${order.customerName},</p>
          <p>Your order has been received and is being processed.</p>
          <p><strong>Order ID:</strong> #${order.id.slice(-6)}</p>
          <p><strong>Product:</strong> ${order.productName}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total:</strong> ${order.total || order.price}</p>
          <p><strong>Order Date:</strong> ${order.date}</p>
          <p>If you have questions, contact us at ${this.supportEmail} or ${this.supportPhone}.</p>
        </div>
      `,
    };
  }

  orderShippedTemplate(order: OrderEmailData) {
    return {
      subject: `Order Shipped - #${order.id.slice(-6)} - ${this.brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2>Your Order Has Shipped</h2>
          <p>Dear ${order.customerName},</p>
          <p>Your order is on the way.</p>
          <p><strong>Order ID:</strong> #${order.id.slice(-6)}</p>
          <p><strong>Product:</strong> ${order.productName}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Shipping:</strong> ${order.cargo || "Standard"}</p>
        </div>
      `,
    };
  }

  orderDeliveredTemplate(order: OrderEmailData) {
    return {
      subject: `Order Delivered - #${order.id.slice(-6)} - ${this.brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2>Your Order Was Delivered</h2>
          <p>Dear ${order.customerName},</p>
          <p>We hope you enjoy your purchase.</p>
          <p><strong>Order ID:</strong> #${order.id.slice(-6)}</p>
          <p><strong>Product:</strong> ${order.productName}</p>
        </div>
      `,
    };
  }

  lowStockAlertTemplate(product: LowStockData) {
    return {
      subject: `Low Stock Alert - ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2>Low Stock Alert</h2>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Current Stock:</strong> ${product.quantity}</p>
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Price:</strong> ${product.price}</p>
        </div>
      `,
    };
  }

  welcomeSellerTemplate(name: string) {
    return {
      subject: `Welcome to ${this.brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2>Welcome, ${name}</h2>
          <p>Your seller account has been approved. You can now list products in ${this.brandName}.</p>
        </div>
      `,
    };
  }

  createHistoryEntry(to: string, subject: string, template: string, status: EmailHistory["status"]): EmailHistory {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      to,
      subject,
      template,
      sentAt: new Date().toISOString(),
      status,
    };
  }
}
