import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const YearPickerCalendar = ({
  name,
  value,
  onChange,
  placeholder = 'Select Year',
  disabled = false,
  readOnly = false,
  required = false,
  className = '',
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const currentYearVal = parseInt(value, 10) || new Date().getFullYear();

  const [startDecadeYear, setStartDecadeYear] = useState(
    Math.floor((currentYearVal - 1950) / 12) * 12 + 1950
  );

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        setStartDecadeYear(Math.floor((parsed - 1950) / 12) * 12 + 1950);
      }
    }
  }, [value]);

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      // Position popover right below input field
      setPopoverPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
  };

  // Close calendar popover on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.year-picker-portal-popover')
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handlePrevDecade = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startDecadeYear - 12 >= minYear - 12) {
      setStartDecadeYear((prev) => prev - 12);
    }
  };

  const handleNextDecade = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startDecadeYear + 12 <= maxYear + 12) {
      setStartDecadeYear((prev) => prev + 12);
    }
  };

  const handleYearSelect = (year, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onChange) {
      onChange({
        target: {
          name,
          value: String(year),
        },
      });
    }
    setIsOpen(false);
  };

  const decadeYears = Array.from({ length: 12 }, (_, i) => startDecadeYear + i);
  const endDecadeYear = startDecadeYear + 11;

  const handleToggleClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!disabled && !readOnly) {
      updatePosition();
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <div
        ref={inputRef}
        onClick={handleToggleClick}
        className="relative flex items-center cursor-pointer select-none"
      >
        <input
          type="text"
          name={name}
          value={value || ''}
          readOnly
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 pr-10 border rounded-xl cursor-pointer transition-all duration-200 ${
            disabled
              ? 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'
              : isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-sm'
              : 'border-gray-300 hover:border-indigo-400 bg-white shadow-xs'
          } ${className}`}
        />
        <div className="absolute right-3 text-gray-400 hover:text-indigo-600 transition-colors pointer-events-none">
          <Calendar size={18} />
        </div>
      </div>

      {/* Calendar Popover via Portal */}
      {isOpen &&
        !disabled &&
        !readOnly &&
        ReactDOM.createPortal(
          <div
            className="year-picker-portal-popover fixed z-[99999] w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 text-left animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 select-none">
              <button
                type="button"
                onClick={handlePrevDecade}
                className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-gray-600"
                title="Previous Years"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="font-bold text-gray-800 text-sm tracking-wide bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                📅 {startDecadeYear} – {endDecadeYear}
              </span>

              <button
                type="button"
                onClick={handleNextDecade}
                className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-gray-600"
                title="Next Years"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Years Grid (3 x 4) */}
            <div className="grid grid-cols-3 gap-2">
              {decadeYears.map((yr) => {
                const isSelected = String(value) === String(yr);
                const isDisabledYear = yr < minYear || yr > maxYear;

                return (
                  <button
                    key={yr}
                    type="button"
                    disabled={isDisabledYear}
                    onClick={(e) => handleYearSelect(yr, e)}
                    className={`py-2 px-3 text-sm font-bold rounded-xl transition-all duration-150 text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                        : isDisabledYear
                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default YearPickerCalendar;
