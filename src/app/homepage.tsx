"use client";

import React, { useState, useEffect } from "react";
import styles from "./homepage.module.css";
import NavBar from "./NavBar";
import EventCarousel from "./EventCarousel";
import Image from "next/image";

interface Event {
  _id: string;
  title: string;
  date: string; // ISO date string
  time: string; // Time string in HH:mm format
  address: string; // Address of the event
  coordinates: string; // Coordinates of the event
  description: string; // Description of the event
  ageRange: string; // Age range of the event
}

export default function HomePage() {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [events, setEvents] = useState<Event[]>([]); // State to store fetched events
  const [translatedContent, setTranslatedContent] = useState({
    heading: "Upcoming Events",
    companyName: "Bright Bridge Youth Education", // Default company name
    description:
    "Connecting youth with engaging workshops, classes, and resources in both English and Hindi, bridging the gap between potential and opportunity – empowering every child to build a brighter future.",
    englishButton: "English",
    hindiButton: "Hindi",
  }); // State to store translated content

  const GOOGLE_TRANSLATE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY; // Access the API key from .env.local

  const fetchTranslation = async (text: string, targetLanguage: string) => {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            target: targetLanguage,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.data) {
        return data.data.translations[0].translatedText;
      } else {
        console.error("Translation API error:", data.error);
        return text; // Fallback to the original text
      }
    } catch (error) {
      console.error("Error fetching translation:", error);
      return text; // Fallback to the original text
    }
  };

  const handleLanguageChange = async (lang: "en" | "hi") => {
    setLanguage(lang);

    if (lang === "hi") {
      // Translate static content to Hindi
      const translatedHeading = await fetchTranslation("Upcoming Events", "hi");
      const translatedCompanyName = await fetchTranslation("Bright Bridge Youth Education", "hi");
      const translatedDescription = await fetchTranslation(
        "Connecting youth with engaging workshops, classes, and resources in both English and Hindi, bridging the gap between potential and opportunity – empowering every child to build a brighter future.",
        "hi"
      );
      const translatedEnglishButton = await fetchTranslation("English", "hi");
      const translatedHindiButton = await fetchTranslation("Hindi", "hi");

      setTranslatedContent({
        heading: translatedHeading,
        companyName: translatedCompanyName,
        description: translatedDescription,
        englishButton: translatedEnglishButton,
        hindiButton: translatedHindiButton,
      });

      // Translate dynamic event data to Hindi
      const translatedEvents = await Promise.all(
        events.map(async (event) => ({
          ...event,
          title: await fetchTranslation(event.title, "hi"),
          address: await fetchTranslation(event.address, "hi"), // Translate address
          description: await fetchTranslation(event.description, "hi"), // Translate description
          ageRange: await fetchTranslation(event.ageRange, "hi"), // Translate age range
        }))
      );

      setEvents(translatedEvents); // Update the events with translated data
    } else {
      // Reset to English
      setTranslatedContent({
        heading: "Upcoming Events",
        companyName: "Bright Bridge Youth Education",
        description:
        "Connecting youth with engaging workshops, classes, and resources in both English and Hindi, bridging the gap between potential and opportunity – empowering every child to build a brighter future.",
        englishButton: "English",
        hindiButton: "Hindi",
      });

      // Fetch the original English events again
      const fetchEvents = async () => {
        try {
          const response = await fetch("/api/events");
          const data = await response.json();

          if (response.ok) {
            setEvents(data.events); // Reset to the original English events
          } else {
            console.error("Failed to fetch events:", data.error);
          }
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      };

      fetchEvents();
    }
  };

  // Fetch events from the backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();

        if (response.ok) {
          setEvents(data.events); // Set the fetched events
        } else {
          console.error("Failed to fetch events:", data.error);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Pass language and handleLanguageChange to NavBar */}
      <NavBar language={language} onLanguageChange={handleLanguageChange} />

      {/* Header Section */}
      <div className={styles.headerContainer}>
        <div className={styles.companyContainer}>
          <h1 className={styles.companyName}>{translatedContent.companyName}</h1>
          <p className={styles.companyDescription}>
            {translatedContent.description}
          </p>
          <div className={styles.languageButtons}>
            <button
              className={`${styles.languageButton} ${
                language === "en" ? styles.selectedButton : ""
              }`}
              onClick={() => handleLanguageChange("en")}
            >
              {translatedContent.englishButton}
            </button>
            <button
              className={`${styles.languageButton} ${
                language === "hi" ? styles.selectedButton : ""
              }`}
              onClick={() => handleLanguageChange("hi")}
            >
              {translatedContent.hindiButton}
            </button>
          </div>
        </div>
        <div className={styles.bannerContainer}>
          <Image
            src="/images/header-image.jpg"
            alt="Banner"
            className={styles.banner}
            width={600}
            height={800}
            priority
          />
        </div>
      </div>

      {/* Event Carousel Section */}
      <h2 className={styles.carouselHeading}>
        {translatedContent.heading}
      </h2>
      <div className={styles.carouselContainer}>
        <EventCarousel
          events={events}
          language={language}
          fetchTranslation={fetchTranslation} // Pass fetchTranslation to EventCarousel
        />
      </div>
    </div>
  );
}