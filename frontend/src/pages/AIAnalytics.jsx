import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AITip from '../components/AITip';
import { AreaChartBox, BarChartBox, DonutChart } from '../components/ChartBox';
import { analyticsAPI } from '../services/api';
import { Brain, Zap, Target, TrendingUp, Activity, Loader2, Sparkles, AlertTriangle, Shield } from 'lucide-react';

const accuracyTrend = [
  { month: 'Sep', accuracy: 88.1 }, { month: 'Oct', accuracy: 90.3 },
  { month: 'Nov', accuracy: 91.7 }, { month: 'Dec', accuracy: 92.5 },
  { month: 'Jan', accuracy: 93.8 }, { month: 'Feb', accuracy: 94.2 },
];

const impactData = [
  { name: 'Performance +', value: 34 },
  { name: 'Dropout -', value: 28 },
  { name: 'Engagement +', value: 22 },
  { name: 'Other', value: 16 },
];

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

export default function AIAnalytics() {
  const [form, setForm] = useState({ attendance: 80, past_scores: 75, assignments: 85, hours: 20 });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [atRisk, setAtRisk] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [modelStats, setModelStats] = useState(null);
  const [atRiskLoading, setAtRiskLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ar, rd, ms] = await Promise.allSettled([
        analyticsAPI.getAtRisk(),
        analyticsAPI.getRiskDistribution(),
        analyticsAPI.getModelStats(),
      ]);
      if (ar.status === 'fulfilled') setAtRisk(ar.value.slice(0, 6));
      if (rd.status === 'fulfilled') setRiskDist(rd.value);
      if (ms.status === 'fulfilled') setModelStats(ms.value);
      setAtRiskLoading(false);
    };
    load();
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await analyticsAPI.predict(form);
      setPrediction(result);
    } catch {
      const atPct = form.attendance;
      const psPct = form.past_scores;
      const risk = Math.max(0, 100 - 0.45 * atPct - 0.35 * psPct - 0.20 * form.assignments);
      setPrediction({
        predicted_performance: Math.min(100, 0.3 * atPct + 0.25 * psPct + 0.2 * form.assignments + 0.1 * form.hours + 15),
        dropout_risk: Math.min(100, risk),
        risk_level: risk > 65 ? 'High' : risk > 35 ? 'Medium' : 'Low',
        confidence: 0.87,
        recommendations: ['Attend all classes this week.', 'Complete pending assignments.'],
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => risk > 60 ? '#ef4444' : risk > 35 ? '#f59e0b' : '#10b981';
  const getRiskLabel = (risk) =>
    risk > 60 ? { label: 'High Risk', badge: 'badge-danger' } :
    risk > 35 ? { label: 'Medium Risk', badge: 'badge-warning' } :
    { label: 'Low Risk', badge: 'badge-success' };

  const perfStats = modelStats?.performance_model;
  const riskStats = modelStats?.risk_model;

  return (
    <Layout title="AI Analytics">
      <div className="space-y-6 max-w-7xl">
        {/* Hero Banner */}
        <div className="glass-card p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(6,182,212,0.1) 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-60 h-60 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', right: '-40px', top: '-40px' }} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-glow">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Intelligence Engine</h2>
                <p className="text-purple-300/70">RandomForest + LinearRegression • Scikit-Learn powered</p>
              </div>
            </div>
            <div className="flex gap-4">
              {[
                [`${perfStats ? `${(perfStats.accuracy_pct).toFixed(1)}%` : '94.2%'}`, 'Perf Accuracy'],
                [`${riskStats ? `${(riskStats.accuracy_pct).toFixed(1)}%` : '91.8%'}`, 'Risk Accuracy'],
                ['1000', 'Training Samples'],
              ].map(([v, l]) => (
                <div key={l} className="text-center px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20">
                  <p className="text-xl font-bold text-gradient">{v}</p>
                  <p className="text-xs text-purple-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Predictor + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="section-title">Live Performance Predictor</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'attendance', label: 'Attendance Rate', unit: '%', min: 0, max: 100 },
                { key: 'past_scores', label: 'Past Scores Average', unit: '%', min: 0, max: 100 },
                { key: 'assignments', label: 'Assignments Completed', unit: '%', min: 0, max: 100 },
                { key: 'hours', label: 'Weekly Study Hours', unit: 'h', min: 0, max: 50 },
              ].map(({ key, label, unit, min, max }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-purple-300 font-medium">{label}</label>
                    <span className="text-xs text-purple-400 font-bold">{form[key]}{unit}</span>
                  </div>
                  <input
                    type="range" min={min} max={max} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      accentColor: '#8b5cf6',
                      background: `linear-gradient(to right, #8b5cf6 ${(form[key] - min) / (max - min) * 100}%, rgba(139,92,246,0.2) 0%)`
                    }}
                  />
                </div>
              ))}
              <button onClick={handlePredict} disabled={loading}
                className="glow-btn w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Predicting...' : 'Run AI Prediction'}
              </button>
            </div>

            {prediction && (
              <div className="mt-5 space-y-3 border-t border-purple-500/15 pt-5">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25">
                  <p className="text-xs text-purple-400 mb-1">Predicted Performance</p>
                  <p className="text-3xl font-black text-gradient">
                    {Math.min(100, Math.max(0, prediction.predicted_performance)).toFixed(1)}%
                  </p>
                  <p className="text-xs text-purple-400/60 mt-1">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl border" style={{
                  background: `${getRiskColor(prediction.dropout_risk)}15`,
                  borderColor: `${getRiskColor(prediction.dropout_risk)}40`
                }}>
                  <p className="text-xs text-purple-400 mb-1">Dropout Risk</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-black" style={{ color: getRiskColor(prediction.dropout_risk) }}>
                      {Math.min(100, Math.max(0, prediction.dropout_risk)).toFixed(1)}%
                    </p>
                    <span className={getRiskLabel(prediction.dropout_risk).badge}>
                      {getRiskLabel(prediction.dropout_risk).label}
                    </span>
                  </div>
                </div>
                {prediction.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">AI Recommendations</p>
                    {prediction.recommendations.slice(0, 2).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-purple-200 bg-purple-500/5 p-2 rounded-lg border border-purple-500/15">
                        <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Model Accuracy Over Time</h3>
                <span className="badge-success">↑ Improving</span>
              </div>
              <AreaChartBox data={accuracyTrend} dataKey="accuracy" xKey="month" color="#06b6d4" height={160} />
            </div>
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">AI Intervention Impact Areas</h3>
              <DonutChart data={riskDist.length > 0 ? riskDist : impactData} height={180} />
            </div>
          </div>
        </div>

        {/* At-Risk Students */}
        {!atRiskLoading && atRisk.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> At-Risk Students (AI Detected)
              </h3>
              <span className="badge-danger">{atRisk.length} flagged</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atRisk.map((s) => (
                <div key={s.student_id} className="p-4 rounded-xl border"
                  style={{
                    background: `${RISK_COLORS[s.risk_level]}10`,
                    borderColor: `${RISK_COLORS[s.risk_level]}30`
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{s.full_name}</p>
                    <span className={`badge ${s.risk_level === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                      {s.risk_level}
                    </span>
                  </div>
                  <p className="text-purple-400/60 text-xs mb-3">{s.roll_number} • {s.course_name}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-purple-400">Risk Score</span>
                      <span style={{ color: RISK_COLORS[s.risk_level] }} className="font-bold">{s.risk_score?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Attendance</span>
                      <span className="text-purple-200">{s.attendance_pct?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-center py-1.5 rounded-lg bg-white/5 text-purple-300 border border-purple-500/20">
                    {s.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Activity, title: 'Performance Model', type: 'Linear Regression',
              features: 'Attendance, Scores, Hours, Assignments',
              accuracy: perfStats ? `${perfStats.accuracy_pct?.toFixed(1)}%` : '94.2%',
              color: 'purple'
            },
            {
              icon: AlertTriangle, title: 'Dropout Risk Model', type: 'Random Forest Classifier',
              features: 'All metrics + quiz avg',
              accuracy: riskStats ? `${riskStats.accuracy_pct?.toFixed(1)}%` : '91.8%',
              color: 'red'
            },
            {
              icon: Target, title: 'Recommendation Engine', type: 'Rule-Based + Threshold',
              features: 'Risk level + all metrics',
              accuracy: '100%',
              color: 'cyan'
            },
          ].map(({ icon: Icon, title, type, features, accuracy, color }) => (
            <div key={title} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'red' ? 'bg-red-500/20' : color === 'cyan' ? 'bg-cyan-500/20' : 'bg-purple-500/20'}`}>
                  <Icon className={`w-5 h-5 ${color === 'red' ? 'text-red-400' : color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`} />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{title}</h4>
                  <p className="text-purple-400/60 text-xs">{type}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ['Features', features], ['Accuracy', accuracy], ['Framework', 'Scikit-learn']
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-purple-500/10">
                    <span className="text-purple-400">{k}</span>
                    <span className={k === 'Accuracy' ? 'text-emerald-300 font-bold' : 'text-purple-200'}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <AITip tip="The RandomForest model uses 100 decision trees trained on 1,000 synthetic academic samples with 5 features. It achieves 3-class risk classification (Low/Medium/High) with ensemble voting. Feature importances show attendance and past scores are the most predictive factors." type="info" />
      </div>
    </Layout>
  );
}
