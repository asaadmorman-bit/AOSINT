import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { toast } from 'sonner';

const APPLICATION_ID = '1477430553904021697';
const BOT_PERMISSIONS = '2147485696'; // Send Messages + Embed Links + Read Message History + Use Slash Commands
const BOT_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands`;

export default function DiscordBotSetup() {
  const [copied, setCopied] = useState(false);

  const commands = [
    {
      name: '/enrich-threat',
      description: 'Get detailed enrichment for a threat',
      options: 'threat_id (required)'
    },
    {
      name: '/search-threats',
      description: 'Search for related threats',
      options: 'query (required)'
    },
    {
      name: '/correlate-threat',
      description: 'Find correlated threats',
      options: 'threat_id (required)'
    },
    {
      name: '/create-alert-rule',
      description: 'Create a new alert rule',
      options: 'rule_name, target_channel, threat_actors, sectors, severities'
    },
    {
      name: '/list-alert-rules',
      description: 'List all active alert rules in this server',
      options: 'None'
    },
    {
      name: '/delete-alert-rule',
      description: 'Delete an alert rule',
      options: 'rule_id (required)'
    }
  ];

  const botPermissions = [
    'Send Messages',
    'Embed Links',
    'Read Message History',
    'Use Slash Commands',
    'Use Application Commands'
  ];

  const setupSteps = [
    {
      title: '1. Invite Bot to Your Server',
      description: 'Click the "Invite Bot" button below to add the ASOSINT bot to your Discord server.',
      action: { label: 'Invite Bot to Server', url: BOT_INVITE_URL }
    },
    {
      title: '2. Copy Your Server ID',
      description: 'Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode), then right-click your server → Copy Server ID.'
    },
    {
      title: '3. Configure Server in ASOSINT',
      description: 'Go to the "Server Management" tab, click "New Server", and paste your Discord Server ID.'
    },
    {
      title: '4. Done!',
      description: 'The bot will create threat intelligence channels in your server automatically.'
    }
  ];

  const registerCommandsScript = `const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { token, clientId, guildId } = require('./config.json');

const commands = [
  {
    name: 'enrich-threat',
    description: 'Get detailed enrichment for a threat',
    options: [
      {
        name: 'threat_id',
        description: 'The threat ID to enrich',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'search-threats',
    description: 'Search for related threats',
    options: [
      {
        name: 'query',
        description: 'Search query',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'correlate-threat',
    description: 'Find correlated threats',
    options: [
      {
        name: 'threat_id',
        description: 'The threat ID to correlate',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'create-alert-rule',
    description: 'Create a new alert rule',
    options: [
      { name: 'rule_name', description: 'Rule name', type: 3, required: true },
      { name: 'target_channel', description: 'Target channel ID', type: 3, required: true },
      { name: 'threat_actors', description: 'Threat actors (comma-separated)', type: 3 },
      { name: 'sectors', description: 'Sectors (comma-separated)', type: 3 },
      { name: 'severities', description: 'Severities (comma-separated)', type: 3 }
    ]
  },
  {
    name: 'list-alert-rules',
    description: 'List all active alert rules'
  },
  {
    name: 'delete-alert-rule',
    description: 'Delete an alert rule',
    options: [
      {
        name: 'rule_id',
        description: 'The rule ID to delete',
        type: 3,
        required: true
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Bot className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Set up your Discord bot for threat intelligence commands and alert management.
        </AlertDescription>
      </Alert>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to configure your Discord bot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <Bot className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900">App ID: {APPLICATION_ID}</p>
            </div>
            <Button size="sm" onClick={() => window.open(BOT_INVITE_URL, '_blank')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white flex-shrink-0">
              Invite Bot
            </Button>
          </div>
          {setupSteps.map((step, i) => (
            <div key={i} className="flex gap-4 pb-4 border-b last:border-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{step.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                {step.action && (
                  <Button size="sm" className="mt-2 bg-[#5865F2] hover:bg-[#4752C4] text-white" onClick={() => window.open(step.action.url, '_blank')}>
                    {step.action.label}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bot Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Required Bot Permissions</CardTitle>
          <CardDescription>Ensure your bot has these permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {botPermissions.map((perm, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">{perm}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Available Commands</CardTitle>
          <CardDescription>Slash commands your bot will respond to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {commands.map((cmd, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-sm text-blue-600">{cmd.name}</div>
              <p className="text-xs text-gray-600 mt-1">{cmd.description}</p>
              <p className="text-xs text-gray-500 mt-1">Options: {cmd.options}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Command Registration Script */}
      <Card>
        <CardHeader>
          <CardTitle>Command Registration Script</CardTitle>
          <CardDescription>Use this script to register commands with Discord</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              <code>{registerCommandsScript}</code>
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(registerCommandsScript)}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Run this script with your Discord bot token and client ID to register all slash commands.
          </p>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Configure your bot's Interactions Endpoint URL in the Discord Developer Portal to:
          <br />
          <code className="bg-amber-100 px-2 py-1 rounded mt-2 block font-mono text-xs">
            https://your-app-domain/api/handleDiscordInteraction
          </code>
        </AlertDescription>
      </Alert>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features Enabled</CardTitle>
          <CardDescription>Your bot can now:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Enrich threats with detailed intelligence data</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Search for related threats by query</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Find threat correlations and relationships</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Create and manage alert rules directly in Discord</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Send real-time threat alerts to specific channels</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Interactive buttons for threat enrichment and search</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}