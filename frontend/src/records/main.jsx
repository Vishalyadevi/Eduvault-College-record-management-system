import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StudentProvider } from './records/contexts/StudentContext';
import { StaffProvider } from './records/contexts/StaffContext';
import { UserProvider } from './records/contexts/UserContext';
import { InternProvider } from './records/contexts/InternContext';
import { DashboardProvider } from './records/contexts/DashboardContext';
import { OrganizedEventProvider } from './records/contexts/OrganizedEventContext';
import { AttendedEventProvider } from './records/contexts/AttendedEventContext';
import { AppProvider } from './records/contexts/AppContext';
import { LocationProvider } from './records/contexts/LocationContext';
import { ScholarshipProvider } from './records/contexts/ScholarshipContext';
import { LeaveProvider } from './records/contexts/LeaveContext';
import { OnlineCoursesProvider } from './records/contexts/OnlineCoursesContext';
import { AchievementProvider } from './records/contexts/AchievementContext';
import { StudentDataProvider } from './records/contexts/studentDataContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudentDataProvider>
      <AchievementProvider>
        <OnlineCoursesProvider>
          <LeaveProvider>
            <OrganizedEventProvider>
              <ScholarshipProvider>
                <LocationProvider>
                  <AppProvider>
                    <AttendedEventProvider>
                      <InternProvider>
                        <DashboardProvider>
                          <UserProvider>
                            <StudentProvider>
                              <StaffProvider>
                                <BrowserRouter>
                                  <App />
                                </BrowserRouter>
                              </StaffProvider>
                            </StudentProvider>
                          </UserProvider>
                        </DashboardProvider>
                      </InternProvider>
                    </AttendedEventProvider>
                  </AppProvider>
                </LocationProvider>
              </ScholarshipProvider>
            </OrganizedEventProvider>
          </LeaveProvider>
        </OnlineCoursesProvider>
      </AchievementProvider>
    </StudentDataProvider>
  </StrictMode>
);