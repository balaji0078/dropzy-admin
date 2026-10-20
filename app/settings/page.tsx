"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Bell,
  DollarSign,
  Zap,
  Save,
  X,
  Edit2,
  Check,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    company_name: "Dropzy Logistics",
    logo_url: "https://example.com/logo.png",
    contact_email: "support@dropzy.in",
    contact_phone: "+91-1234567890",
    timezone: "Asia/Kolkata",
    currency: "INR",
  });

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [tempGeneralSettings, setTempGeneralSettings] = useState(generalSettings);

  // Notification Templates State
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Booking Confirmation",
      channel: "both",
      text: "Your booking has been confirmed! Tracking ID: {{tracking_id}}. Driver will arrive in {{eta}} minutes.",
    },
    {
      id: 2,
      name: "Status Update",
      channel: "both",
      text: "Your package is {{status}}. Current location: {{location}}. Delivery ETA: {{eta}}.",
    },
    {
      id: 3,
      name: "Delivery Complete",
      channel: "both",
      text: "Package delivered! Thank you {{customer_name}}, we hope you enjoyed our service. Track ID: {{tracking_id}}",
    },
    {
      id: 4,
      name: "Driver Accepted",
      channel: "sms",
      text: "Driver {{driver_name}} has accepted your delivery. ETA: {{eta}} minutes.",
    },
    {
      id: 5,
      name: "Ready for Pickup",
      channel: "whatsapp",
      text: "Your package is ready for pickup at {{hub_location}}. Available until {{closing_time}}.",
    },
  ]);

  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [tempTemplate, setTempTemplate] = useState<any>(null);

  // Pricing Settings State
  const [pricingSettings, setPricingSettings] = useState({
    base_rate: 50,
    per_km_rate: 8,
    gst_percentage: 18,
  });

  const [editingPricing, setEditingPricing] = useState(false);
  const [tempPricingSettings, setTempPricingSettings] = useState(pricingSettings);

  // Integration Status State
  const [integrations, setIntegrations] = useState([
    { name: "GDS Route API", status: "connected", enabled: true },
    { name: "SMS Gateway", status: "connected", enabled: true },
    { name: "WhatsApp Business API", status: "connected", enabled: true },
    { name: "Payment Gateway", status: "disconnected", enabled: false },
    { name: "E-way Bill API", status: "disconnected", enabled: false },
  ]);

  // General Settings Handlers
  const handleGeneralChange = (field: string, value: string) => {
    setTempGeneralSettings({ ...tempGeneralSettings, [field]: value });
  };

  const saveGeneralSettings = () => {
    setGeneralSettings(tempGeneralSettings);
    setEditingGeneral(false);
    setMessage({ type: "success", text: "General settings saved successfully!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const cancelGeneralEdit = () => {
    setTempGeneralSettings(generalSettings);
    setEditingGeneral(false);
  };

  // Template Handlers
  const startEditTemplate = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setTempTemplate({ ...template });
      setEditingTemplate(id);
    }
  };

  const saveTemplate = () => {
    if (tempTemplate) {
      setTemplates(
        templates.map((t) => (t.id === tempTemplate.id ? tempTemplate : t))
      );
      setEditingTemplate(null);
      setTempTemplate(null);
      setMessage({ type: "success", text: "Template saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const cancelTemplateEdit = () => {
    setEditingTemplate(null);
    setTempTemplate(null);
  };

  // Pricing Handlers
  const handlePricingChange = (field: string, value: string) => {
    setTempPricingSettings({
      ...tempPricingSettings,
      [field]: parseFloat(value) || 0,
    });
  };

  const savePricingSettings = () => {
    setPricingSettings(tempPricingSettings);
    setEditingPricing(false);
    setMessage({ type: "success", text: "Pricing settings saved successfully!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const cancelPricingEdit = () => {
    setTempPricingSettings(pricingSettings);
    setEditingPricing(false);
  };

  // Integration Toggle
  const toggleIntegration = (name: string) => {
    setIntegrations(
      integrations.map((int) =>
        int.name === name
          ? {
              ...int,
              enabled: !int.enabled,
            }
          : int
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-success/10 border-success/35"
              : "bg-danger/10 border-danger/35"
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === "success"
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="rb-card p-1">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "general"
                ? "bg-gold/10 text-gold shadow-[inset_0_-2px_0_#F5C451]"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "bg-gold/10 text-gold shadow-[inset_0_-2px_0_#F5C451]"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "pricing"
                ? "bg-gold/10 text-gold shadow-[inset_0_-2px_0_#F5C451]"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Pricing
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "integrations"
                ? "bg-gold/10 text-gold shadow-[inset_0_-2px_0_#F5C451]"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Integrations
          </button>
        </div>
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="rb-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink">General Settings</h2>
            {!editingGeneral && (
              <button
                onClick={() => setEditingGeneral(true)}
                className="rb-btn rb-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Company Name
              </label>
              {editingGeneral ? (
                <input
                  type="text"
                  value={tempGeneralSettings.company_name}
                  onChange={(e) => handleGeneralChange("company_name", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  {generalSettings.company_name}
                </p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Contact Email
              </label>
              {editingGeneral ? (
                <input
                  type="email"
                  value={tempGeneralSettings.contact_email}
                  onChange={(e) => handleGeneralChange("contact_email", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  {generalSettings.contact_email}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Contact Phone
              </label>
              {editingGeneral ? (
                <input
                  type="tel"
                  value={tempGeneralSettings.contact_phone}
                  onChange={(e) => handleGeneralChange("contact_phone", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  {generalSettings.contact_phone}
                </p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Timezone
              </label>
              {editingGeneral ? (
                <select
                  value={tempGeneralSettings.timezone}
                  onChange={(e) => handleGeneralChange("timezone", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              ) : (
                <p className="text-ink font-medium">
                  {generalSettings.timezone}
                </p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Currency
              </label>
              {editingGeneral ? (
                <select
                  value={tempGeneralSettings.currency}
                  onChange={(e) => handleGeneralChange("currency", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              ) : (
                <p className="text-ink font-medium">
                  {generalSettings.currency}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {editingGeneral && (
              <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--dz-line)" }}>
                <button
                  onClick={saveGeneralSettings}
                  className="rb-btn rb-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={cancelGeneralEdit}
                  className="rb-btn rb-btn-outline px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rb-card p-6"
            >
              {editingTemplate === template.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={tempTemplate.name}
                      onChange={(e) =>
                        setTempTemplate({ ...tempTemplate, name: e.target.value })
                      }
                      className="rb-input w-full px-4 py-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Channel
                    </label>
                    <select
                      value={tempTemplate.channel}
                      onChange={(e) =>
                        setTempTemplate({ ...tempTemplate, channel: e.target.value })
                      }
                      className="rb-input w-full px-4 py-2 rounded-xl"
                    >
                      <option value="sms">SMS Only</option>
                      <option value="whatsapp">WhatsApp Only</option>
                      <option value="both">Both SMS & WhatsApp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Template Text
                    </label>
                    <textarea
                      value={tempTemplate.text}
                      onChange={(e) =>
                        setTempTemplate({ ...tempTemplate, text: e.target.value })
                      }
                      className="rb-input w-full px-4 py-2 rounded-xl"
                      rows={4}
                    />
                    <p className="text-xs text-ink-soft mt-2">
                      {"Available variables: {{customer_name}}, {{tracking_id}}, {{status}}, {{location}}, {{eta}}, {{driver_name}}, {{hub_location}}, {{closing_time}}"}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--dz-line)" }}>
                    <button
                      onClick={saveTemplate}
                      className="rb-btn rb-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Template
                    </button>
                    <button
                      onClick={cancelTemplateEdit}
                      className="rb-btn rb-btn-outline px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-ink">
                        {template.name}
                      </h3>
                      <p className="text-xs text-ink-soft mt-1">
                        Channel:{" "}
                        <span className="font-medium">
                          {template.channel === "both"
                            ? "SMS & WhatsApp"
                            : template.channel.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => startEditTemplate(template.id)}
                      className="rb-btn rb-btn-outline px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-ink leading-relaxed rb-card-flat p-3 rounded-lg">
                    {template.text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === "pricing" && (
        <div className="rb-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink">Pricing Settings</h2>
            {!editingPricing && (
              <button
                onClick={() => setEditingPricing(true)}
                className="rb-btn rb-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Base Rate */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Base Rate (INR)
              </label>
              {editingPricing ? (
                <input
                  type="number"
                  value={tempPricingSettings.base_rate}
                  onChange={(e) => handlePricingChange("base_rate", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  ₹{pricingSettings.base_rate}
                </p>
              )}
              <p className="text-xs text-ink-soft mt-1">Base charge per delivery</p>
            </div>

            {/* Per KM Rate */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Per KM Rate (INR)
              </label>
              {editingPricing ? (
                <input
                  type="number"
                  value={tempPricingSettings.per_km_rate}
                  onChange={(e) => handlePricingChange("per_km_rate", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  ₹{pricingSettings.per_km_rate} /km
                </p>
              )}
              <p className="text-xs text-ink-soft mt-1">Charge per kilometer</p>
            </div>

            {/* GST Percentage */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                GST Percentage (%)
              </label>
              {editingPricing ? (
                <input
                  type="number"
                  value={tempPricingSettings.gst_percentage}
                  onChange={(e) => handlePricingChange("gst_percentage", e.target.value)}
                  className="rb-input w-full px-4 py-2 rounded-xl"
                />
              ) : (
                <p className="text-ink font-medium">
                  {pricingSettings.gst_percentage}%
                </p>
              )}
              <p className="text-xs text-ink-soft mt-1">Goods & Services Tax</p>
            </div>

            {/* Action Buttons */}
            {editingPricing && (
              <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--dz-line)" }}>
                <button
                  onClick={savePricingSettings}
                  className="rb-btn rb-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={cancelPricingEdit}
                  className="rb-btn rb-btn-outline px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="rb-card p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    integration.status === "connected"
                      ? "bg-success"
                      : "bg-line-strong"
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {integration.name}
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      integration.status === "connected"
                        ? "text-success"
                        : "text-ink-soft"
                    }`}
                  >
                    {integration.status === "connected"
                      ? "Connected"
                      : "Disconnected"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleIntegration(integration.name)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  integration.enabled ? "bg-success" : "bg-line-strong"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-surface transition-transform ${
                    integration.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
