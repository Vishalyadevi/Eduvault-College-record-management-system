import React from 'react';
import { Calendar } from 'lucide-react';

interface EventCardProps {
  date: string;
  month: string;
  title: string;
  eventDate: string;
  imageUrl: string;
}

const EventCard: React.FC<EventCardProps> = ({ date, month, title, eventDate, imageUrl }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200">
      <div className="flex items-center gap-4 p-4">
        {/* Image Section - Small thumbnail */}
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 mb-2 leading-tight hover:text-indigo-900 transition-colors cursor-pointer line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            <span>{eventDate}</span>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-1.5 rounded text-xs font-semibold transition-all duration-300 shadow-sm">
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;