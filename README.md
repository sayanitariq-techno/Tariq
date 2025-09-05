# Technofiable Engineering LLP - Shutdown & Turnaround Management Software

This is a comprehensive project management application designed specifically for industrial shutdowns and turnarounds. It provides real-time tracking, detailed reporting, and powerful data management features to ensure your projects run smoothly and efficiently.

## Key Features

### 1. Interactive Dashboard
The main dashboard provides a high-level, at-a-glance overview of the entire project's health.
- **Project Summary:** Key performance indicators (KPIs) including:
  - **Actual vs. Planned Progress:** Visualized with circular progress bars.
  - **Key Metrics:** Counts of completed, delayed, on-track, and upcoming activities.
  - **Schedule Variance:** Calculates the gain or loss in hours on the critical path.
  - **Important Dates:** Displays planned start/end, actual start, and AI-estimated end dates.
- **S-Curve Chart:** A graphical representation of planned progress versus actual completion over the project timeline. This chart can be filtered to show data for all packages or a single, specific package.
- **Recent Jobs:** A live table showing all activities that are currently "In Progress".
- **All Activities View:** A comprehensive and filterable table of all incomplete activities, allowing you to focus on what's overdue, on hold, or scheduled for today.
- **Downloadable Reports:** Export the entire dashboard summary into a formatted **PDF** or a multi-sheet **Excel** file with a single click.

### 2. Package & Activity Management
This is the core of the application, allowing for detailed planning and execution management.
- **Package Hub:** A central page displaying all work packages as cards, each showing its overall progress, status, and key dates.
- **Full CRUD Operations:** You can **Create, Read, Update, and Delete** packages and activities through intuitive dialog forms.
- **Detailed Package View:** Clicking on a package takes you to a dedicated page with:
  - A detailed summary of the package's status, progress, and schedule.
  - Activities grouped by their **Equipment Tag** in a searchable, collapsible accordion view.
  - The ability to view all activities in a single, unified list.
- **Live Activity Status Updates:** From any activity list, you can:
  - Start, Pause (On Hold), or Complete an activity.
  - The system automatically records the actual start and end times.
- **AI-Powered Hold Reasons:** When placing an activity on hold, an AI assistant suggests a probable reason and detailed remarks based on the activity's context, speeding up data entry.

### 3. Live Planning Bar & Hold Log
- **Live Planning Bar:** A dedicated page that provides a powerful, filterable view of every single activity in the project. It's designed for planners and supervisors to manage day-to-day operations effectively.
- **Hold Log & Analysis:** This page provides critical insights into project delays. It features:
  - A detailed, chronological log of all hold events.
  - A summary table that groups holds by reason, calculating the total time lost and frequency for each cause.

### 4. Advanced Reporting
- **Custom Report Generator:** A dedicated page to create detailed, professional status update reports for clients or stakeholders. The form is pre-filled with project data, and you can add custom notes before exporting.
- **Comprehensive PDF Export:** Generates a multi-page PDF document including project details, summary, package status, hold log analysis, and any required support notes.

### 5. Bulk Data Management
- **Bulk Upload System:** A dedicated page to import project data from an Excel file, saving hours of manual entry.
  - **Downloadable Template:** Provides a pre-formatted, two-sheet Excel template for defining **Packages** and **Activities**, with clear examples and correct date formats.
  - **Validation & Preview:** The system validates the uploaded file, shows a preview of the data, and highlights any errors (e.g., mismatched Package IDs).
  - **Confirm Import:** Data is only added to the system after you review the preview and confirm the import.

This application is built with Next.js, React, Tailwind CSS, and ShadCN UI for a modern, responsive, and performant user experience.
