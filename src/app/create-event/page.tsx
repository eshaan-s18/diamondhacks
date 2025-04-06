"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useAdmin } from "../AdminContext";
import styles from "./createEvent.module.css";

export default function CreateEvent() {
  const { adminEmail } = useAdmin();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(""); // State for time
  const [address, setAddress] = useState(""); // State for address
  const [coordinates, setCoordinates] = useState(""); // State for coordinates
  const [description, setDescription] = useState(""); // State for description
  const [ageRange, setAgeRange] = useState("All Ages"); // Default to "All Ages"
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail) {
      alert("You must be logged in to create an event.");
      return;
    }

    let derivedCoordinates = "N/A"; // Default to "N/A" if coordinates cannot be found

    try {
      // Fetch coordinates from Google Geocoding API
      const geocodingResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY}`
      );

      const geocodingData = await geocodingResponse.json();

      if (geocodingData.status === "OK") {
        // Extract coordinates from the API response
        const location = geocodingData.results[0].geometry.location;
        derivedCoordinates = `${location.lat},${location.lng}`;
      } else {
        console.warn(
          `Geocoding API failed with status: ${geocodingData.status}. Using "N/A" for coordinates.`
        );
      }

      // Prepare event data
      const eventData = {
        title,
        date,
        time, // Include the time field
        address, // Include the address field
        coordinates: derivedCoordinates, // Use derived coordinates or "N/A"
        description, // Include the description field
        ageRange, // Include the age range field
        adminEmail, // Include the admin's email
      };

      // Send event data to the backend
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Event created successfully!");
        router.push("/your-events"); // Navigate back to /your-events
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Create Event</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />
        <input
          type="date"
          placeholder="Event Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
        />
        <input
          type="time"
          placeholder="Event Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Event Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={styles.input}
        />
        <textarea
          placeholder="Event Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
        />
        <div className={styles.ageRangeContainer}>
          <label htmlFor="ageRange" className={styles.label}>
            Age Range:
          </label>
          <select
            id="ageRange"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className={styles.select}
          >
            <option value="All Ages">All Ages</option>
            <option value="5-10 years">5-10 years</option>
            <option value="10-15 years">10-15 years</option>
            <option value="15-18 years">15-18 years</option>
            <option value="18+ years">18+ years</option>
          </select>
        </div>
        <button type="submit" className={styles.submitButton}>
          Create Event
        </button>
      </form>
    </div>
  );
}