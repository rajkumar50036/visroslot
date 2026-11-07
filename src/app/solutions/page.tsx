import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { Scissors, Stethoscope, Sparkles, Dumbbell, Briefcase, GraduationCap, Check, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Solutions — VisroSlot",
  description: "Made for salons, clinics, fitness studios, consultants, and tutors who work by appointment.",
};

export default function SolutionsPage() {
  const industries = [
    {
      id: "salons",
      icon: Scissors,
      title: "Salons and Beauty Businesses",
      tagline: "Manage appointments, services, employees and customer visits.",
      description:
        "Give your clients an easy way to book haircuts, treatments, and styling sessions from your Instagram bio or WhatsApp link. Keep your styling stations organized without double bookings.",
      points: [
        "Clients pick services and convenient time slots online",
        "Automatic assignment to available stylists",
        "Keep track of client visit history and preferred services",
        "Printable QR code for reception and table displays",
      ],
      plan: "Professional or Business",
    },
    {
      id: "clinics",
      icon: Stethoscope,
      title: "Clinics and Dental Practices",
      tagline: "Organize consultation schedules and manage appointment availability.",
      description:
        "Set consultation times, manage doctor schedules, and keep your waiting room comfortable by spreading patient arrivals evenly throughout the day.",
      points: [
        "Set buffer times between patient consultations",
        "Organize doctor shifts and working hours",
        "Collect patient contact information in one place",
        "Share booking link with patients via WhatsApp",
      ],
      plan: "Business Plan",
    },
    {
      id: "fitness",
      icon: Dumbbell,
      title: "Fitness Studios and Personal Trainers",
      tagline: "Schedule training sessions and manage trainer availability.",
      description:
        "Let gym members and private clients book one-on-one personal training, fitness consultations, and coaching sessions directly with your trainers.",
      points: [
        "Manage multiple trainer schedules in one dashboard",
        "Prevent overlapping equipment and training slots",
        "Clients can reschedule easily if their schedule changes",
        "Track completed client sessions over time",
      ],
      plan: "Professional or Business",
    },
    {
      id: "consultants",
      icon: Briefcase,
      title: "Consultants and Advisors",
      tagline: "Let clients choose a suitable consultation time.",
      description:
        "Eliminate back-and-forth messaging. Share your VisroSlot booking link with clients so they can pick an open consultation slot that matches your working hours.",
      points: [
        "Share your personalized link in email signatures and bios",
        "Collect client details and consultation notes beforehand",
        "Set minimum advance notice to avoid last-minute bookings",
        "Simple calendar view for your upcoming meetings",
      ],
      plan: "Professional Plan",
    },
    {
      id: "tutors",
      icon: GraduationCap,
      title: "Tutors and Academies",
      tagline: "Organize student sessions and lesson schedules.",
      description:
        "Coordinate private coaching, music lessons, academic tutoring, and language sessions with an organized online timetable.",
      points: [
        "Organize individual student lesson slots",
        "Set custom durations for different subjects or sessions",
        "Keep parents informed with clear booking confirmations",
        "View weekly lesson timetables at a glance",
      ],
      plan: "Professional Plan",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6] block">
            Tailored Solutions
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#10251D] dark:text-[#FFFFFF]">
            Made for businesses that work by appointment.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
            VisroSlot is built for service businesses where organized scheduling, happy customers, and balanced staff workloads matter every day.
          </p>
        </div>

        {/* Industry Cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.id}
                id={ind.id}
                className="p-8 sm:p-10 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                          {ind.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#046A38] dark:text-[#9EF6B6] font-medium font-mono">
                          {ind.tagline}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                      {ind.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {ind.points.map((pt) => (
                        <div key={pt} className="flex items-start gap-2 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8]">
                          <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end justify-between self-stretch pt-4 md:pt-0 border-t md:border-t-0 border-[#D8DED8] dark:border-[#D8DED8]/20">
                    <span className="text-xs text-[#707974] dark:text-[#A7B9AA]">
                      Recommended: <strong className="text-[#10251D] dark:text-[#FFFFFF]">{ind.plan}</strong>
                    </span>
                    <Link
                      href="/pricing"
                      className="mt-4 px-5 py-2.5 rounded-md text-xs font-bold text-[#FFFFFF] bg-[#046A38] hover:bg-[#043D2E] transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
