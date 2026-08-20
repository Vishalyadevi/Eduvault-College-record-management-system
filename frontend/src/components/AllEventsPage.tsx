import React from 'react';
import EventCard from './EventCard';

const allEvents = [
  // Add more events or repeat existing ones to simulate full list
  {
    date: '12',
    month: 'Apr',
    title: '41st Annual Day Celebrations',
    eventDate: '12/04/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/41stAnnualDayCelebrations-1024x1024.jpg',
  },
  {
    date: '07',
    month: 'Apr',
    title: '41st Annual Sports Day',
    eventDate: '07/04/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/IMG-20250407-WA0000-1024x1024.jpg',
  },
  {
    date: '25',
    month: 'Mar',
    title: 'Career Guidance Conclave',
    eventDate: '25/03/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/03/IMG-20250314-WA0119-1024x1024.jpg',
  },
  {
    date: '24',
    month: 'Mar',
    title: 'Two-days Faculty Development Program (FDP)',
    eventDate: '24/03/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-19-at-7.53.14-PM-1024x1024.jpeg',
  },
  {
    date: '12',
    month: 'Apr',
    title: '41st Annual Day Celebrations',
    eventDate: '12/04/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/41stAnnualDayCelebrations-1024x1024.jpg',
  },
  {
    date: '07',
    month: 'Apr',
    title: '41st Annual Sports Day',
    eventDate: '07/04/2025',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/IMG-20250407-WA0000-1024x1024.jpg',
  },
  // Add more events here
];

const AllEventsPage = () => {
  return (
    <div className="min-h-screen px-4 py-10 bg-white">
      <h2 className="text-3xl font-bold text-blue-900 text-center mb-10">All Events</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {allEvents.map((event, index) => (
          <EventCard key={index} {...event} />
        ))}
      </div>
    </div>
  );
};

export default AllEventsPage;
