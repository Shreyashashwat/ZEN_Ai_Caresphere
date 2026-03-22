import React from "react";

const About = () => {
  const features = [
    {
      title: "Smart Medicine Reminders",
      description:
        "Schedule and receive timely alerts so every dose stays on track, even on busy days.",
    },
    {
      title: "AI Health Insights",
      description:
        "Understand trends from your daily health activity with clear, actionable summaries.",
    },
    {
      title: "Unified Care Dashboard",
      description:
        "Monitor reminders, medicines, and wellness progress from one clean, focused workspace.",
    },
  ];

  const highlights = [
    { value: "24/7", label: "Companion support" },
    { value: "Personalized", label: "AI guidance" },
    { value: "Secure", label: "Health-first design" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800">
      <section className="relative overflow-hidden bg-indigo-600 text-white px-6 py-20 sm:px-12 lg:px-24">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-medium tracking-wide text-indigo-100 backdrop-blur-sm">
              Health-Powered AI Application
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              CareSphere
            </h1>
            <p className="mt-5 max-w-2xl text-base text-indigo-100 sm:text-lg lg:text-xl">
              A professional digital care experience for reminders, health tracking, and AI-assisted wellness decisions.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-indigo-600 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get Started
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 font-semibold text-white transition duration-300 hover:bg-white/20"
              >
                Contact Team
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl transition duration-500 hover:-translate-y-1">
            <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1588776814546-02c63cb42a1a?auto=format&fit=crop&w=1000&q=80"
                alt="Smart Health Tracker"
                className="h-72 w-full rounded-2xl object-cover sm:h-80"
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-center transition duration-300 hover:bg-white/20"
            >
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-sm text-indigo-100">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-indigo-700 sm:text-4xl">
              Why CareSphere
            </h2>
            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Purpose-built for modern health management with a clean experience that keeps patients and caregivers aligned.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 h-1.5 w-12 rounded-full bg-indigo-500 transition-all duration-300 group-hover:w-16" />
                <h3 className="text-xl font-semibold text-indigo-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-gray-700">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-indigo-700 sm:text-4xl">
              Our Mission
            </h2>
            <p className="mt-5 text-gray-700">
              CareSphere empowers people to take charge of their health through intelligent reminders, organized tracking, and AI-powered support that feels simple and reliable.
            </p>
            <p className="mt-4 text-gray-700">
              From daily medication routines to long-term wellness monitoring, every interaction is designed to reduce stress and improve confidence in care decisions.
            </p>
          </div>

          <div className="transition duration-500 hover:-translate-y-1">
            <img
              src="https://plus.unsplash.com/premium_photo-1661779396815-56fe1ca9877c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
              alt="Our Mission"
              className="h-72 w-full rounded-3xl border-4 border-white object-cover shadow-2xl sm:h-96"
            />
          </div>
        </div>
      </section>

      <section className="rounded-t-3xl bg-indigo-600 px-6 py-20 text-center text-white sm:px-12 lg:px-24">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to Take Control of Your Health?
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base text-indigo-100 sm:text-lg">
          Join users and families using CareSphere to make health routines easier, clearer, and more consistent.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-10 py-3 font-semibold text-indigo-600 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        >
          Start Tracking Today
        </a>
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CareSphere — Built for smarter, healthier living.
      </footer>
    </div>
  );
};

export default About;
