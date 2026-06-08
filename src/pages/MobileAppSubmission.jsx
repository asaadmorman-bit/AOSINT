import React, { useState } from "react";
import { Smartphone, Chrome, Apple, CheckCircle2, FileText, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MobileAppSubmission() {
  const [expandedStep, setExpandedStep] = useState(null);

  const googlePlaySteps = [
    {
      title: "Set Up Google Play Console",
      description: "Register a Google Play Developer account ($25 one-time fee)",
      details: [
        "Visit https://play.google.com/console",
        "Sign in with your Google account",
        "Accept the Developer Agreement and pay the registration fee",
        "Set up your developer profile with payment method",
      ],
    },
    {
      title: "Create a Native Android Wrapper",
      description: "Use tools like Capacitor or Cordova to wrap the PWA",
      details: [
        "Install Capacitor: npm install -g @capacitor/cli",
        "Initialize Capacitor: npx cap init",
        "Add Android platform: npx cap add android",
        "Build the PWA: npm run build",
        "Copy to Capacitor: npx cap copy",
        "Open in Android Studio: npx cap open android",
      ],
    },
    {
      title: "Configure App Details",
      description: "Fill in app store listing details",
      details: [
        "App name: ASOSINT - Threat Intelligence",
        "Subtitle: Advanced Open-Source Intelligence Platform",
        "Description: Real-time threat intelligence, monitoring, and analysis",
        "Category: Tools or Business",
        "Add screenshots (min 2, max 8)",
        "Add promotional graphic (1024×500px)",
        "Set age rating (answer content rating questionnaire)",
      ],
    },
    {
      title: "Build Release APK/AAB",
      description: "Generate signed release build",
      details: [
        "In Android Studio: Build > Generate Signed Bundle/APK",
        "Select AAB format (recommended for Play Store)",
        "Create or select keystore file",
        "Use release build variant",
        "Wait for generation to complete",
      ],
    },
    {
      title: "Submit to Google Play",
      description: "Upload and submit your app for review",
      details: [
        "Go to Google Play Console > Create new app",
        "Fill out all required information",
        "Upload AAB file to 'Production' or 'Internal testing' track",
        "Review content rating and privacy policies",
        "Submit for review (typically 2-4 hours for automated review)",
        "Wait for approval",
      ],
    },
  ];

  const appStoreSteps = [
    {
      title: "Set Up Apple Developer Account",
      description: "Register with Apple Developer Program ($99/year)",
      details: [
        "Visit https://developer.apple.com",
        "Sign in with Apple ID (create if needed)",
        "Enroll in Apple Developer Program",
        "Complete identity verification",
        "Set up payment method (annual subscription)",
      ],
    },
    {
      title: "Create iOS Wrapper App",
      description: "Build native iOS wrapper using Capacitor",
      details: [
        "Install Capacitor: npm install -g @capacitor/cli",
        "Initialize (if not done): npx cap init",
        "Add iOS platform: npx cap add ios",
        "Build the PWA: npm run build",
        "Copy to Capacitor: npx cap copy",
        "Open in Xcode: npx cap open ios",
      ],
    },
    {
      title: "Configure App Details",
      description: "Set up app metadata in App Store Connect",
      details: [
        "Go to https://appstoreconnect.apple.com",
        "Create new app (select iOS app)",
        "Bundle ID format: com.yourcompany.asosint",
        "App name: ASOSINT",
        "Subtitle: Threat Intelligence",
        "Primary category: Productivity or Business",
        "Add up to 5 screenshots per device type",
        "Add 1024×500px preview image",
      ],
    },
    {
      title: "Build and Archive",
      description: "Generate release build in Xcode",
      details: [
        "In Xcode: Select 'Any iOS Device (arm64)' as build target",
        "Product > Build",
        "Product > Archive",
        "In Organizer window, select latest archive",
        "Click 'Distribute App'",
        "Select 'App Store Connect' as distribution method",
      ],
    },
    {
      title: "Submit to App Store",
      description: "Complete review and submit",
      details: [
        "In App Store Connect, fill out Version Info",
        "Select build for submission",
        "Complete privacy, IDFA, and KidsApps sections",
        "Add review notes (mention PWA-based app, offline functionality)",
        "Submit for review (typically 24-48 hours)",
        "Monitor review status in App Store Connect",
      ],
    },
  ];

  const pwaFeatures = [
    { feature: "Offline Support", status: "native" },
    { feature: "Push Notifications", status: "partial" },
    { feature: "Home Screen Install", status: "native" },
    { feature: "App Icon", status: "native" },
    { feature: "Splash Screen", status: "native" },
    { feature: "Fast Load Time", status: "native" },
    { feature: "Responsive Design", status: "native" },
  ];

  const StepCard = ({ step, index }) => (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden"
      key={index}
    >
      <button
        onClick={() => setExpandedStep(expandedStep === index ? null : index)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{step.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          </div>
        </div>
        <span className={`transform transition-transform ${expandedStep === index ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {expandedStep === index && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <ul className="space-y-2">
            {step.details.map((detail, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <code className="bg-white px-2 py-1 rounded text-xs font-mono text-gray-700 flex-1 border border-gray-200">
                  {detail}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Mobile App Deployment</h1>
        </div>
        <p className="text-gray-600">
          Deploy ASOSINT as a PWA and native apps on Google Play Store and Apple App Store.
        </p>
      </div>

      {/* PWA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Progressive Web App (PWA) - Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Your app is configured as a PWA with all required features:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {pwaFeatures.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{item.feature}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 pt-2 border-t">
            💡 PWA can be accessed at any time and works offline with cached data. Users can install directly from browser.
          </p>
        </CardContent>
      </Card>

      {/* Tabs for Store Instructions */}
      <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Chrome className="w-4 h-4" />
            Google Play Store
          </TabsTrigger>
          <TabsTrigger value="apple" className="flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Apple App Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Tools Required:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Node.js & npm (already installed)</li>
                  <li>• Java Development Kit (JDK 11+)</li>
                  <li>• Android Studio</li>
                  <li>• Capacitor CLI</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Installation:</h4>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto font-mono">
                  npm install -g @capacitor/cli
                </code>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {googlePlaySteps.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} />
            ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Review Guidelines:</p>
                  <ul className="space-y-1 text-xs list-disc ml-4">
                    <li>Ensure app has clear and informative privacy policy</li>
                    <li>All permissions must be explained in app</li>
                    <li>Test on multiple Android versions (API 26+)</li>
                    <li>Typical review time: 2-4 hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apple" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Requirements:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Mac with Xcode 14+</li>
                  <li>• Apple Developer account ($99/year)</li>
                  <li>• iOS 13+ (minimum deployment target)</li>
                  <li>• Capacitor CLI</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Setup:</h4>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto font-mono">
                  npm install -g @capacitor/cli @capacitor/core
                </code>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {appStoreSteps.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} />
            ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">App Store Review:</p>
                  <ul className="space-y-1 text-xs list-disc ml-4">
                    <li>Apple typically reviews within 24-48 hours</li>
                    <li>Mention PWA wrapper in review notes</li>
                    <li>Clear privacy policy required</li>
                    <li>Test on iPhone and iPad</li>
                    <li>Minimum iOS 13 support recommended</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Direct PWA Link */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="w-5 h-5" />
            Start Here: Access PWA Directly
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Users can access your PWA immediately without waiting for app store approval:
          </p>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Desktop/Mobile Browser:</p>
            <p className="text-xs text-gray-600">
              Visit your app URL and click "Install" when prompted, or use browser menu (Chrome: Menu → Install app)
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">iOS:</p>
            <p className="text-xs text-gray-600">
              Open in Safari → Share → Add to Home Screen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Useful Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resources & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://capacitor.ionicframework.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Capacitor Documentation <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://play.google.com/console/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Google Play Console <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://appstoreconnect.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            App Store Connect <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://web.dev/progressive-web-apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            PWA Best Practices <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}