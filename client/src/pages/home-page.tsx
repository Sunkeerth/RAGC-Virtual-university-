// src/pages/home-page.tsx
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Headset,
  Users,
  Rocket,
  Award,
  Briefcase,
  Cpu,
  Code,
  Network,
  ScanEye,
  BrainCircuit,
  BookOpen,
  Upload
} from "lucide-react";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, navigate] = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleDocumentUpload = () => navigate("/documents");

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <Sidebar />
        </aside>

        <main className="flex-1 overflow-y-auto bg-background px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-6">
              <div className="bg-primary/10 p-8 rounded-2xl border border-primary/20">
                <h1 className="text-4xl font-bold text-primary mb-4">
                  Welcome to RGAC Virtual University
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Revolutionizing education through immersive VR technology and hands-on learning.
                  Get started by uploading your documents to begin your journey.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    onClick={handleDocumentUpload}
                    className="gap-2 px-8 py-6 text-lg hover:bg-primary/90"
                    size="lg"
                  >
                    <Upload className="w-5 h-5" />
                    Start Enrollment Now
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 px-8 py-6 text-lg"
                    size="lg"
                    onClick={() => window.scrollTo(0, document.body.scrollHeight)}
                  >
                    <BookOpen className="w-5 h-5" />
                    Learn More
                  </Button>
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Headset className="w-8 h-8" />}
                title="Immersive Learning"
                description="Experience virtual labs with realistic simulations and hands-on practice"
              />
              <FeatureCard
                icon={<Users className="w-8 h-8" />}
                title="Expert Mentors"
                description="1-on-1 guidance from industry professionals and academic leaders"
              />
              <FeatureCard
                icon={<Rocket className="w-8 h-8" />}
                title="Career Ready"
                description="Gain job-ready skills with our industry-aligned curriculum"
              />
            </section>

            {/* Virtual Lab Section */}
            <section className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-primary mb-2">
                  Virtual Lab Experience
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore our cutting-edge virtual laboratories powered by latest technologies
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labCards.map((card) => (
                  <FacilityCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    items={card.items}
                  />
                ))}
              </div>
            </section>

            {/* Enrollment CTA */}
            <section className="bg-primary/5 p-8 rounded-2xl border border-primary/10 text-center">
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl font-bold text-primary">
                  Ready to Begin Your VR Learning Journey?
                </h2>
                <p className="text-muted-foreground">
                  Upload your documents to complete enrollment and get immediate access to:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                  <BenefitItem text="Virtual Lab Access" />
                  <BenefitItem text="Expert Mentorship" />
                  <BenefitItem text="Career Services" />
                  <BenefitItem text="Industry Projects" />
                  <BenefitItem text="Skill Certifications" />
                  <BenefitItem text="24/7 Support" />
                </div>
                {/* <Button
                  onClick={handleDocumentUpload}
                  className="gap-2 px-8 py-6 text-lg mx-auto"
                  size="lg"
                >
                  <Upload className="w-5 h-5" />
                  Complete Enrollment
                </Button> */}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-background p-6 rounded-xl border border-border hover:border-primary/50 transition-all">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const BenefitItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
    <span className="text-primary">✓</span>
    <span className="text-sm">{text}</span>
  </div>
);

const FacilityCard = ({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) => (
  <Card className="transition-all hover:shadow-lg hover:border-primary border-border border h-full">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-center text-sm">
          <span className="text-primary mr-2">▹</span>
          {item}
        </div>
      ))}
    </CardContent>
  </Card>
);

const labCards = [
  {
    icon: <Cpu className="w-8 h-8" />,
    title: "Lab Modules",
    items: [
      "Electronics: Virtual circuits with Arduino & sensors",
      "Robotics: Program bots with motors & sensors",
      "CSE: Virtual IDEs for Python/ML programming",
      "IoT: Simulated device networks & protocols"
    ]
  },
  {
    icon: <ScanEye className="w-8 h-8" />,
    title: "Key Features",
    items: [
      "Real equipment interaction in 3D space",
      "Instant visual feedback (LEDs, sensors)",
      "Multiplayer collaboration rooms",
      "AI-powered lab assistant"
    ]
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: "Learning Tools",
    items: [
      "Drag & drop component interface",
      "In-VR code editors & compilers",
      "Multimedia whiteboards & annotations",
      "Voice chat & avatar system"
    ]
  },
  {
    icon: <Network className="w-8 h-8" />,
    title: "Technologies",
    items: [
      "Unity3D & WebXR for VR rendering",
      "Node.js + MongoDB backend",
      "AWS EC2 & S3 cloud hosting",
      "WebSocket real-time communication"
    ]
  },
  {
    icon: <BrainCircuit className="w-8 h-8" />,
    title: "Benefits",
    items: [
      "70% cost savings vs physical labs",
      "24/7 access from any device",
      "Unlimited lab retries & experiments",
      "Portfolio-ready project exports"
    ]
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: "Evaluation System",
    items: [
      "No traditional exams",
      "Hackathon performance tracking",
      "Project-based assessments",
      "Skill completion dashboards"
    ]
  }
];

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-background p-4 rounded-lg shadow-sm border border-border text-center">
    <div className="text-2xl font-bold text-primary mb-1">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);