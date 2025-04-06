/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname
import { useAdmin } from "../AdminContext";
import EventCarousel from "../EventCarousel"; // Import the EventCarousel component
import styles from "./yourEvents.module.css";

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

export default function YourEvents() {
  const { adminEmail } = useAdmin(); // Get the logged-in admin's email
  const [events, setEvents] = useState<Event[]>([]); // State to store the user's events
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState<string | null>(null); // State to track errors
  const pathname = usePathname(); // Get the current route

  // Fetch the admin's events
  const fetchAdminEvents = async () => {
    if (!adminEmail) return;

    setLoading(true); // Set loading to true before fetching
    try {
      // Fetch the admin document
      const response = await fetch(`/api/admin?email=${adminEmail}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const eventIds = data.events; // Array of event IDs from the admin's document

        // Fetch event details using the event IDs
        const eventsResponse = await fetch(`/api/events?eventIds=${eventIds.join(",")}`);
        const eventsData = await eventsResponse.json();

        if (eventsResponse.ok && eventsData.success) {
          setEvents(eventsData.events); // Set the fetched events
        } else {
          console.error("Failed to fetch event details:", eventsData.error);
          setError("Failed to fetch your events. Please try again later.");
        }
      } else {
        console.error("Failed to fetch admin data:", data.error);
        setError("Failed to fetch your events. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching admin events:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Fetch events on component mount and when the route changes
  useEffect(() => {
    fetchAdminEvents();
  }, [adminEmail, pathname]); // Trigger fetchAdminEvents when pathname changes

  return (
    <div className={styles.pageContainer}>
      {/* Back Button */}
      <div className={styles.backButtonContainer}>
        <Link href="/">
          <button className={styles.backButton}>← Back to Home</button>
        </Link>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Your Events</h1>
        <Link href="/create-event">
          <button className={styles.createEventButton}>+ Create Event</button>
        </Link>
      </div>

      {/* Event Carousel Section */}
      <div className={styles.carouselContainer}>
        {loading ? (
          <p className={styles.loadingMessage}>Loading your events...</p>
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : events.length > 0 ? (
          <EventCarousel events={events} language="en" fullScreenModal={true} />
        ) : (
          <p className={styles.noEventsMessage}>You haven't created any events yet.</p>
        )}
      </div>
    </div>
  );
}