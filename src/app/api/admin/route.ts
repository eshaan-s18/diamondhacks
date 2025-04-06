/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ success: false, error: "All fields are required" });
    }

    const client = await clientPromise;
    const db = client.db("diamondhacks-database");
    const adminCollection = db.collection("admin");

    // Insert the admin document with the desired fields, including an empty events array
    const result = await adminCollection.insertOne({
      "first name": firstName,
      "last name": lastName,
      "email": email,
      "events": [], // Initialize with an empty array
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error in POST /api/admin:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" });
    }

    const client = await clientPromise;
    const db = client.db("diamondhacks-database");
    const adminCollection = db.collection("admin");

    // Find the admin document by email
    const admin = await adminCollection.findOne({ email });

    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin not found" });
    }

    return NextResponse.json({
      success: true,
      firstName: admin["first name"],
      lastName: admin["last name"],
      events: admin.events || [], // Include the events array
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function PATCH(request: Request) {
  try {
    const { email, eventId } = await request.json();

    if (!email || typeof email !== "string" || !eventId || typeof eventId !== "string") {
      return NextResponse.json({ success: false, error: "Invalid email or eventId" });
    }

    const client = await clientPromise;
    const db = client.db("diamondhacks-database");
    const adminCollection = db.collection("admin");

    // Add the event ID to the admin's events array
    const result = await adminCollection.updateOne(
      { email }, // Find the admin by email
      { $addToSet: { events: eventId } } // Add eventId to the events array if it doesn't already exist
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" });
    }

    // Fetch the updated admin document
    const updatedAdmin = await adminCollection.findOne({ email });

    return NextResponse.json({ success: true, data: updatedAdmin });
  } catch (error: any) {
    console.error("Error in PATCH /api/admin:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}