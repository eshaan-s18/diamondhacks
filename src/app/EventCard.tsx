/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import styles from "./eventCard.module.css";

interface EventCardProps {
  title: string;
  date: string; // ISO date string
  time: string; // Time string in HH:mm format
  address: string;
  description: string; // Add description to the props
}

export default function EventCard({ title, date, time, address, description }: EventCardProps) {
  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));

  const formattedTime = (() => {
    const [hours, minutes] = time.split(":").map(Number);
    const dateObj = new Date();
    dateObj.setHours(hours, minutes);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(dateObj);
  })();

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.date}>
        {formattedDate} at {formattedTime}
      </p>
      <p className={styles.address}>{address}</p>
      {/* The description is stored but not displayed */}
    </div>
  );
}