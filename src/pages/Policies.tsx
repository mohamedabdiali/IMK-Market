import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MIN_ORDER_QUANTITY } from "@/lib/constants";

export default function Policies() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Policies &amp; Procedures
            </h1>
            <p className="text-primary-foreground/80 mt-2">
              Clear rules for buyers, sellers, suppliers, and manufacturers on IMK-Market.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-10">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-2">Minimum Order Quantity (MOQ)</h2>
              <p className="text-muted-foreground">
                All products on IMK-Market have a minimum order quantity of{" "}
                <span className="font-semibold text-foreground">{MIN_ORDER_QUANTITY} pcs</span>.
                Orders below MOQ are automatically adjusted to meet the minimum.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">Partner Onboarding</h2>
                <p className="text-muted-foreground">
                  Sellers, suppliers, and manufacturers register through the same partner application
                  and are reviewed before activation.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Complete business profile and compliance documents.</li>
                  <li>Admin reviews and approves or rejects with notes.</li>
                  <li>Approved partners gain access to the partner dashboard and tools.</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">Product Listing Procedure</h2>
                <p className="text-muted-foreground">
                  Products must follow IMK-Market content and quality standards.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Accurate product name, pricing, category, and media.</li>
                  <li>Listings may be reviewed or paused for compliance.</li>
                  <li>Inactive or misleading listings can be removed.</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">Order &amp; Payment Procedure</h2>
                <p className="text-muted-foreground">
                  Orders are confirmed after payment verification and required approvals.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Customers submit orders with preferred payment methods.</li>
                  <li>Payment proof is reviewed when required.</li>
                  <li>Tracking updates are provided after fulfillment begins.</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">Shipping &amp; Logistics</h2>
                <p className="text-muted-foreground">
                  Shipping options vary by destination, product type, and carrier availability.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Estimated delivery windows are displayed at checkout.</li>
                  <li>Tracking IDs are issued when parcels are dispatched.</li>
                  <li>Delays are communicated through order notifications.</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">Returns &amp; Money-Back</h2>
                <p className="text-muted-foreground">
                  Returns are handled according to product category and seller policy.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Eligible refunds for late, damaged, or mismatched items.</li>
                  <li>Return requests must include evidence and order details.</li>
                  <li>Approved refunds are processed to the original method.</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-bold">After-Sales Support</h2>
                <p className="text-muted-foreground">
                  Support continues after delivery with assistance and dispute handling.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Warranty and maintenance support where applicable.</li>
                  <li>Replacement parts coordinated through partners.</li>
                  <li>Escalation path for unresolved issues.</li>
                </ul>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-3">
              <h2 className="text-xl font-bold">Compliance &amp; Prohibited Items</h2>
              <p className="text-muted-foreground">
                IMK-Market enforces local and international trade rules. Listings that violate regulations
                are removed and may result in account suspension.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>No counterfeit, restricted, or illegal goods.</li>
                <li>Accurate origin, certification, and safety details are required.</li>
                <li>Partners must maintain valid licenses and records.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-2">
              <h2 className="text-xl font-bold">Data &amp; Privacy</h2>
              <p className="text-muted-foreground">
                Customer and partner data is handled securely. Access is role-based and audited.
                System administrators review access logs and enforce security policies.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
