/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdsParam = searchParams.get("eventIds");

    const client = await clientPromise;
    const db = client.db("diamondhacks-database");
    const eventsCollection = db.collection("events");

    let events;

    if (eventIdsParam) {
      // Convert string IDs to ObjectId
      const eventIds = eventIdsParam.split(",").map((id) => new ObjectId(id));
      events = await eventsCollection.find({ _id: { $in: eventIds } }).toArray();
    } else {
      // Fetch all events if no specific IDs are provided
      events = await eventsCollection.find({}).toArray();
    }

    // Map MongoDB `_id` to `id` for frontend compatibility
    const formattedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      date: event.date,
      time: event.time, // Include the time field
      address: event.address, // Include the address field
      coordinates: event.coordinates, // Include the coordinates field
      description: event.description, // Include the description field
      ageRange: event.ageRange, // Include the age range field
    }));

    return NextResponse.json({ success: true, events: formattedEvents });
  } catch (error: any) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const { title, date, time, address, coordinates, description, adminEmail, ageRange } =
      await request.json();

    // Validate required fields
    if (
      !title ||
      !date ||
      !time ||
      !address ||
      !coordinates ||
      !description ||
      !adminEmail ||
      !ageRange
    ) {
      return NextResponse.json({ success: false, error: "All fields are required" });
    }

    const client = await clientPromise;
    const db = client.db("diamondhacks-database");
    const eventsCollection = db.collection("events");
    const adminCollection = db.collection("admin");

    // Convert the date to a string
    const formattedDate = new Date(date).toISOString(); // Converts to ISO string format

    // Insert the new event into the events collection
    const eventResult = await eventsCollection.insertOne({
      title,
      date: formattedDate, // Store the date as a string
      time, // Store the time as a string
      address, // Store the address
      coordinates, // Store the coordinates
      description, // Store the description
      ageRange, // Store the age range
    });

    const eventId = eventResult.insertedId.toString();

    // Add the event ID to the admin's events array
    const adminResult = await adminCollection.updateOne(
      { email: adminEmail },
      { $addToSet: { events: eventId } } // Add eventId to the events array if it doesn't already exist
    );

    if (adminResult.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" });
    }

    return NextResponse.json({ success: true, eventId });
  } catch (error: any) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}