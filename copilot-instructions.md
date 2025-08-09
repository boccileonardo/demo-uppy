# App Description:

Develop a web application that provides file uploading services to users with a secure user authentication system. The uploaded files should be stored in Azure Blob Storage. We will be using uppy.js as the file upload system and python, sqlite and fastapi as the backend. 

# Application Type:

Web Application 

# Core Features:

1. User Authentication: The web application should include a login screen where users log in. Their accounts are pre-created by an admin. They are prompted to replace their password on the first login.

2. File Upload Portal: Implement a file upload system where users can upload single or multiple files at once. We will be using uppy.js to facilitate this.

3. Azure Blob Storage: The app should automatically upload the received files from the users to Azure Blob Storage.

# Secondary Features:

1. File Validation: The application should validate the type and size of the uploaded files before uploading them to Azure Blob Storage (files will only be allowed for structured data so use appropriate file types).

2. Progress Indicator: The system should showcase the progress of the file upload to the user.

3. Error Handling: The application should gracefully handle any errors during the file upload process and inform the user accordingly.

# Design Principles:

1. User-friendly Interface: The design should be intuitive and easy to navigate.

2. Consistent Design: Maintain consistency in design elements such as colors, fonts, and styles.

3. Responsive Design: The application should be responsive and function efficiently across various devices.

# Technical Requirements:

1. React: The web application should be developed using React.js for the frontend.

2. TypeScript: Use TypeScript for static type checking.

3. Tailwind CSS: Utilize Tailwind CSS for styling the application.

4. uppy.js: Implement file upload using uppy.js library.

5. Azure Blob Storage: Use Azure Blob Storage for storing the uploaded files.

# Implementation Guidance:

1. Develop the user authentication feature using React and TypeScript.

2. Implement the file upload portal using uppy.js. Ensure it supports bulk upload and displays a progress indicator.

3. Validate the uploaded files. Check for file type and size before uploading.

4. Set up Azure Blob Storage and configure it to receive and store the uploaded files.

5. Implement error handling mechanisms to catch and display errors during the file upload process.

6. Use Tailwind CSS to style the application. Ensure responsiveness for different devices.

7. Perform rigorous testing to ensure all features are working as expected.

# User Experience:

1. Users should easily register and log in to the application.

2. The file upload process should be simple and straightforward.

3. Users should be informed about the progress of their file upload and be notified upon successful upload or in case of errors.

4. The application should be responsive and provide a seamless experience on all devices. 

# Sections:

1. User Authentication
2. File Upload Portal
3. Azure Blob Storage Integration
4. File Validation
5. Progress Indicator
6. Error Handling
7. Styling and Responsiveness
8. Testing and Deployment