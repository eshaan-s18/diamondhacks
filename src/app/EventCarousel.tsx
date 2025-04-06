"use client";

import React, { useState } from "react";
import styles from "./eventCarousel.module.css";
import EventCard from "./EventCard";
import { GoogleGenAI } from "@google/genai";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"; // Import Google Maps components

interface Event {
  _id: string;
  title: string;
  date: string; // ISO date string
  time: string; // Time string in HH:mm format
  location: string; // Location of the event
  address: string; // Address of the event
  coordinates: string; // Coordinates of the event
  description: string; // Description of the event
  ageRange: string; // Age range of the event
}

interface EventCarouselProps {
  events: Event[]; // Accept events as a prop
  language: "en" | "hi";
  fullScreenModal?: boolean; // Optional prop to control modal size
}

export default function EventCarousel({
  events,
  language,
  fullScreenModal = false, // Default to false
}: EventCarouselProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Track the selected event
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal state
  const [aiResponse, setAiResponse] = useState<string | null>(null); // Store the AI response
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null); // Track the audio object

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY; // Access the API key from .env.local

  // Load the Google Maps API once
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event); // Set the selected event
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setSelectedEvent(null); // Clear the selected event
    setIsModalOpen(false); // Close the modal
    setAiResponse(null); // Clear the AI response
    setIsLoading(false); // Reset loading state
    speechSynthesis.cancel(); // Stop any ongoing speech synthesis

    // Stop the audio playback
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setAudio(null); // Clear the audio object
    }
  };

  const printPage = () => {
    window.print();
  };



  const speakContent = async () => {
    if (!selectedEvent) return;

    const convertTo12HourFormat = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for midnight
        return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };
    
      // Convert the time to 12-hour format
      const formattedTime = convertTo12HourFormat(selectedEvent.time);
  
    const content = `
  Title: ${selectedEvent.title}.
  Date: ${new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(selectedEvent.date))} at ${formattedTime}.
  Address: ${selectedEvent.address}.
  Coordinates: ${selectedEvent.coordinates}.
  Age Range: ${selectedEvent.ageRange}.
  Description: ${selectedEvent.description}.
    `;
  
    try {
      // Send a POST request to the TTS API route
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }
  
      // Get the audio content as a Blob
      const audioBlob = await response.blob();
  
      // Create an audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      setAudio(newAudio); // Store the new audio object in state
      newAudio.play();
    } catch (error) {
      console.error("Error generating speech:", error);
      alert("Failed to generate speech. Please try again.");
    }
  };

  const mapContainerStyle = {
    width: "100%",
    height: "300px",
  };

  const getCoordinates = () => {
    if (!selectedEvent || !selectedEvent.coordinates || selectedEvent.coordinates === "N/A") {
      return null; // Return null if coordinates are invalid or "N/A"
    }
    const [lat, lng] = selectedEvent.coordinates.split(",").map(Number);
    return { lat, lng };
  };
  

  const generateAiResponse = async () => {
    if (!selectedEvent) return;

    setIsLoading(true); // Show loading indicator

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY }); // Use Gemini AI

      // Construct the prompt for the AI
      const prompt = `
        Create an educational lesson plan based on the following details:
        - Title: ${selectedEvent.title}
        - Description: ${selectedEvent.description}
        - Address: ${selectedEvent.address}
        - Coordinates: ${selectedEvent.coordinates}
        - Age Range: ${selectedEvent.ageRange}
        - Date: ${new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date(selectedEvent.date))}

        The lesson plan is for impoverished youth in India. They do not have
        access to modern technology or resources. Please create a comprehensive
        lesson plan that should include objectives, activities, and expected outcomes.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setAiResponse(response.text); // Set the AI response
    } catch (error) {
      console.error("Error generating AI response:", error);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  const downloadPdf = () => {
    if (!aiResponse || !selectedEvent) return;

    const doc = new jsPDF();

    // Format the content for the PDF
    const formattedContent = `
Lesson Plan: ${selectedEvent.title}

Date: ${new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(selectedEvent.date))}

Address: ${selectedEvent.address}
Coordinates: ${selectedEvent.coordinates}
Age Range: ${selectedEvent.ageRange}

${aiResponse
      .replace(/##\s/g, "") // Remove Markdown headings (##)
      .replace(/\*\*\s?/g, "") // Remove bold markers (**)
      .replace(/\*\s/g, "- ") // Replace unordered list markers (*) with dashes (-)
      .replace(/\n\s*\n/g, "\n\n") // Ensure proper spacing between paragraphs
    }
    `;

    // Split the content into lines that fit within the page width
    const pageWidth = 180; // Width of the text area in the PDF
    const lineHeight = 10; // Height of each line
    const marginTop = 10; // Top margin
    const marginLeft = 10; // Left margin
    const pageHeight = doc.internal.pageSize.height; // Height of the page
    const lines = doc.splitTextToSize(formattedContent, pageWidth);

    let cursorY = marginTop;

    // Loop through the lines and add them to the PDF
    lines.forEach((line) => {
      if (cursorY + lineHeight > pageHeight - marginTop) {
        // Add a new page if the content overflows
        doc.addPage();
        cursorY = marginTop;
      }
      doc.text(line, marginLeft, cursorY);
      cursorY += lineHeight;
    });

    // Save the PDF
    doc.save(`${selectedEvent.title}_Lesson_Plan.pdf`);
  };

  return (
    <div className={styles.carousel}>
      {events.map((event) => (
        <div
          key={event._id}
          onClick={() => handleEventClick(event)} // Handle click on event
          className={styles.eventCardWrapper}
        >
          <EventCard
            title={language === "en" ? event.title : event.title}
            date={event.date}
            time={event.time}
            location={event.location}
            description={event.description}
          />
        </div>
      ))}

      {/* Modal for Event Details */}
      {isModalOpen && selectedEvent && (
        <div
          className={`${styles.modalOverlay} ${
            fullScreenModal ? styles.fullScreenModalOverlay : ""
          }`}
          onClick={closeModal}
        >
          <div
            className={`${styles.modalContent} ${
              fullScreenModal ? styles.fullScreenModalContent : ""
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            {/* Buttons for Regular Modal */}
            {!fullScreenModal && (
              <div className={styles.modalHeader}>
                <button className={styles.printButton} onClick={printPage}>
                  Print
                </button>
                <button className={styles.speakButton} onClick={speakContent}>
                  Speak
                </button>
              </div>
            )}

            <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
            <div className={styles.modalScrollableContent}>
              <p className={styles.modalDate}>
                {new Intl.DateTimeFormat("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                }).format(new Date(selectedEvent.date))}{" "}
                at{" "}
                {new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                }).format(new Date(`1970-01-01T${selectedEvent.time}:00`))}
              </p>
              <p className={styles.modalAddress}><strong>Address:</strong> {selectedEvent.address}</p>
              <p className={styles.modalCoordinates}><strong>Coordinates:</strong> {selectedEvent.coordinates}</p>
              <p className={styles.modalAgeRange}><strong>Age Range:</strong> {selectedEvent.ageRange}</p>
              <p className={styles.modalDescription}><strong>Description:</strong> {selectedEvent.description}</p>


              {/* Google Map */}
                {isLoaded && getCoordinates() && (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={getCoordinates()}
                    zoom={15}
                >
                    <Marker position={getCoordinates()} />
                </GoogleMap>
                )}


              {/* Display AI Response */}
              {isLoading ? (
                <p>Loading...</p> // Show loading indicator
              ) : (
                fullScreenModal &&
                aiResponse && (
                  <div className={styles.lessonPlan}>
                    <h3>Generated Lesson Plan:</h3>
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                )
              )}
            </div>

            {/* Buttons */}
            {fullScreenModal && !isLoading && (
              <button className={styles.generateButton} onClick={generateAiResponse}>
                Generate Lesson Plan
              </button>
            )}
            {aiResponse && (
              <button className={styles.downloadButton} onClick={downloadPdf}>
                Download as PDF
              </button>
            )}
            {/* <button className={styles.closeButton} onClick={closeModal}>
              Close
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}