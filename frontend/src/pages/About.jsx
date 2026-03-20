import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
     
      <section className="relative bg-indigo-600 text-white py-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            CareSphere
          </h1>
          <p className="text-lg sm:text-xl mb-6">
            Your personal companion for managing health, medicine reminders, and wellness insights.
          </p>
          <a
            href="/"
            className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition duration-300"
          >
            Get Started
          </a>
        </div>
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1588776814546-02c63cb42a1a?auto=format&fit=crop&w=800&q=80"
            alt="Smart Health Tracker"
            className="w-80 sm:w-96 rounded-xl shadow-2xl border-4 border-white"
          />
        </div>
      </section>

      
      <section className="py-32 px-6 sm:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-indigo-700 mb-12">
            Why Choose CareSphere?
          </h2>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-indigo-50 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold mb-2">Medicine Reminders</h3>
              <p className="text-gray-700">
                Never miss a dose. Get timely notifications for all your medicines.
              </p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold mb-2">Health Insights</h3>
              <p className="text-gray-700">
                Track your progress, monitor trends, and make informed decisions about your health.
              </p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold mb-2">Personal Dashboard</h3>
              <p className="text-gray-700">
                Get a personalized overview of your medicines, reminders, and wellness in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

   
      <section className="py-32 px-6 sm:px-12 lg:px-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-5xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold text-indigo-700 mb-6">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-4">
              At CareSphere, we aim to empower individuals to take control of their health with intelligent tracking and timely reminders. We combine simplicity with technology to make health management effortless.
            </p>
            <p className="text-gray-700">
              Whether you are managing medications, tracking wellness, or monitoring health trends, our app gives you the tools to stay on top of your well-being.
            </p>
          </div>
          <div>
            <img
              src="https://plus.unsplash.com/premium_photo-1661779396815-56fe1ca9877c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
              alt="Our Mission"
              className="rounded-2xl shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      </section>

  
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-indigo-600 text-white text-center rounded-t-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to Take Control of Your Health?
        </h2>
        <p className="mb-8 text-lg sm:text-xl">
          Join thousands of users who are managing their health smarter and easier.
        </p>
        <a
          href="/"
          className="bg-white text-indigo-600 font-semibold px-10 py-3 rounded-full shadow-lg hover:shadow-xl transition duration-300"
        >
          Start Tracking Today
        </a>
      </section>

   
      <footer className="text-center py-6 text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()} Smart Health Tracker — Built for a healthier you 🩺
      </footer>
    </div>
  );
};

export default About;