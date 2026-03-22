import React, { useState } from "react";

const Contact = () => {
  const contactDetails = [
    {
      title: "Email",
      value: "support@caresphere.com",
      hint: "General support and product help",
    },
    {
      title: "Phone",
      value: "+91 98765 43210",
      hint: "Mon–Sat, 9:00 AM to 7:00 PM",
    },
    {
      title: "Address",
      value: "123 Health St, Wellness City, India",
      hint: "CareSphere operations office",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-16 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl">
        <div className="grid lg:grid-cols-2">
          <section className="relative bg-indigo-600 px-8 py-12 text-white sm:px-10 lg:px-12">
            <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-indigo-400/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative">
              <p className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-indigo-100 backdrop-blur-sm">
                Contact CareSphere
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Let&apos;s Build Better Health Experiences
              </h1>
              <p className="mt-4 text-indigo-100 sm:text-lg">
                Reach out for support, feedback, or collaboration opportunities. Our team is here to help.
              </p>

              <div className="mt-10 space-y-4">
                {contactDetails.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/20 bg-white/10 p-4 transition duration-300 hover:bg-white/20"
                  >
                    <h2 className="text-base font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-indigo-50 sm:text-base">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-indigo-100 sm:text-sm">
                      {item.hint}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="px-8 py-12 sm:px-10 lg:px-12">
            <h2 className="text-2xl font-bold text-indigo-700 sm:text-3xl">
              Send a Message
            </h2>
            <p className="mt-2 text-gray-600">
              Fill in the form and we’ll get back to you as soon as possible.
            </p>

            {submitted && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-700">
                Thank you! Your message has been sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1 block font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-gray-700">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Your message..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-indigo-600 py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl"
              >
                Send Message
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contact;
