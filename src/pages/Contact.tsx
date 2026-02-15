import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: MapPin,
    title: "Headquarters",
    details: ["Dubai, United Arab Emirates"],
  },
  {
    icon: Phone,
    title: "Phone",
    details: ["+232-76-123-456"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["info@imkmarket.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat: 10:00 AM - 4:00 PM"],
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Get in <span className="text-accent">Touch</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Have questions about our products or services? Our team is here to help you.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {contactInfo.map((item) => (
                    <div
                      key={item.title}
                      className="bg-card p-6 rounded-xl shadow-sm border border-border"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <item.icon className="h-5 w-5 text-accent" />
                        </div>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Name</label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Address</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>
                  <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
