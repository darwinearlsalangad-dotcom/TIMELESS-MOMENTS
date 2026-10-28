# 🌐 Complete Deployment & Cloud Database Handover Guide
## TIMELESS MOMENTS — Fine Art Photography Portfolio & Management System

This guide explains how to deploy the entire system to **100% Free Cloud Hosting** and connect a **100% Free MongoDB Atlas Cloud Database**, allowing your client to freely manipulate all photos, reviews, inquiries, and website details.

---

## 📋 System Architecture Overview

```
                      +---------------------------------------+
                      |         Live Visitors / Clients       |
                      |   (View Galleries, Rate, Send Inquiries)|
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Render.com (Free Web Host)      |
                      |         Node.js Express Server        |
                      +-------------------+-------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
                   v                                             v
+------------------------------------+         +------------------------------------+
|  MongoDB Atlas (100% Free Cloud)   |         |   Studio Admin Portal (Built-in)   |
|   - site_config (Bio, Info, Nav)   |         |     URL: /admin.html               |
|   - photos (Stored + Persistent)   | <=====> |   (Client uploads, deletes, and    |
|   - comments (Reviews & Ratings)   |         |    manages website with 1 click)   |
|   - inquiries (Booking Requests)   |         +------------------------------------+
+------------------------------------+
```

---

## 🗄️ PART 1: Set Up 100% Free MongoDB Atlas Cloud Database (3 Minutes)

MongoDB Atlas gives you a **Free Forever (M0)** cloud database cluster with 512MB of storage (no credit card required).

### Step 1: Create an Account
1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Sign up with Google, GitHub, or your email.

### Step 2: Create a Free Shared Cluster
1. Choose the **M0 Free** tier (labeled "Shared" or "Free Forever").
2. Cloud Provider: Select **AWS** or **Google Cloud**.
3. Region: Select **Singapore (ap-southeast-1)** or the region closest to the Philippines.
4. Cluster Name: `Cluster0` (or `timeless-moments`).
5. Click **Create Deployment**.

### Step 3: Set Database Username & Password
1. Set an admin username (e.g. `timeless_admin`).
2. Set a secure password (e.g. `MySecurePass123!`).
   > ⚠️ **Important:** Remember this password! Avoid using special characters like `@` or `:` inside the password string.
3. Click **Create Database User**.

### Step 4: Configure Network Access (Allow from Anywhere)
1. Under **Where would you like to connect from?**, select **Cloud Environment** or **My Local Environment**.
2. Add IP: enter `0.0.0.0/0` (Description: `Allow all connections for cloud hosting`).
3. Click **Add Entry**, then click **Finish and Close**.

### Step 5: Get Your Connection String
1. On your Database Deployments screen, click the **Connect** button next to your cluster.
2. Select **Drivers** (Node.js).
3. Copy your connection string. It looks like:
   ```
   mongodb+srv://timeless_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your real password, and append `/timeless_moments` before the `?`:
   ```
   mongodb+srv://timeless_admin:MySecurePass123!@cluster0.abcde.mongodb.net/timeless_moments?retryWrites=true&w=majority
   ```

---

## 🚀 PART 2: Deploy to Render.com (100% Free)

Render runs your Node.js server 24/7 with a free permanent HTTPS domain.

### Step 1: Push Code to GitHub
Open PowerShell in this project folder and run:
```bash
git init
git add .
git commit -m "Deploy Timeless Moments with MongoDB Cloud"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **New +** (top right) &rarr; **Web Service**.
3. Connect your GitHub repository (`IT ELECTIVE 1 FINALS`).
4. Configure service settings:
   - **Name:** `timeless-moments`
   - **Region:** `Singapore` (fastest for Philippines/Asia)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Step 3: Add the MongoDB Environment Variable
1. In the **Environment Variables** section on Render, click **Add Environment Variable**.
   - **Key:** `MONGODB_URI`
   - **Value:** Paste your MongoDB connection string from Part 1:
     `mongodb+srv://timeless_admin:MySecurePass123!@cluster0.abcde.mongodb.net/timeless_moments?retryWrites=true&w=majority`
2. Click **Deploy Web Service**.

### Step 4: Done!
* Render builds your app in 1-2 minutes.
* You get your permanent live URL:
  `https://timeless-moments.onrender.com`
* On first launch, the server **automatically seeds** all categories, reviews, founder bio, and existing photos from `site-data.json` directly into your MongoDB Atlas cloud database!

---

## 🤝 PART 3: How to Hand Over the Entire System to Your Client

Your client has **two ways** to manipulate their website:

### Option 1: The Built-in Studio Admin Portal (Easiest & Recommended)
Your client does not need to know any programming. They can manage everything directly through the website:

1. Give the client their website link:
   - `https://timeless-moments.onrender.com/admin.html`
2. Default Password: `admin` *(The client can change this anytime under the Security tab).*
3. **What the client can do:**
   - **Upload Photos:** Drag & drop new photos, select the target category (Wedding, Portraits, etc.) and album, and publish immediately to the live site.
   - **Delete Photos:** Browse all uploaded photos with thumbnails and delete unwanted shots.
   - **Edit Studio Details:** Update founder name, biography, contact email, phone number, and social media links.
   - **Moderate Reviews & Praise:** View all client comments and star ratings, with the ability to delete spam.
   - **View Inquiries:** Read all wedding & milestone consultation requests submitted by visitors.

---

### Option 2: Direct MongoDB Atlas Cloud Manipulation (For Raw Database Access)
If your client wants direct control over their raw database:

1. **Invite Client to MongoDB Atlas:**
   - In MongoDB Atlas, go to **Project Access Manager** &rarr; **Invite**.
   - Enter your client's email address and assign them the **Project Read/Write** role.
2. **Accessing the Visual Database GUI:**
   - The client logs in to [cloud.mongodb.com](https://cloud.mongodb.com).
   - Click **Browse Collections** on `Cluster0`.
   - They will see the `timeless_moments` database with 4 collections:
     - `site_config`: Main website details, bio, and navigation.
     - `photos`: Every uploaded photograph (metadata + image data).
     - `comments`: All client ratings and reviews.
     - `inquiries`: All client booking consultation messages.
   - The client can click on any document to edit, add new records, or export data.

---

## 🛠️ Testing Locally Before Deploying

You can run the server locally on your computer with or without MongoDB:

1. Open PowerShell in this project folder:
   ```bash
   node server.js
   ```
2. Visit:
   - **Live Site:** `http://localhost:3000/`
   - **Admin Portal:** `http://localhost:3000/admin.html`
   - **System Status API:** `http://localhost:3000/api/status`

*If you add `MONGODB_URI` to your local `.env` file, the server will connect to MongoDB Atlas immediately! If not, it will run smoothly using the local `data/site-data.json` file.*
