import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import SEO from './SEO'
import {
  ArrowLeft,
  Lightbulb,
  Users,
  Clock,
  Target,
  MessageCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

const WorkshopTipsPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="bg-gradient-to-b from-cream-50 to-white min-h-screen">
      <SEO
        title="Workshop Hosting Tips - Sessionkit"
        description="Practical advice for running engaging workshops, meetings, and training sessions. Learn how to use interactive tools effectively, manage energy, and avoid common facilitation pitfalls."
        keywords="workshop tips, facilitation tips, meeting facilitation, classroom management, interactive teaching, engagement strategies, workshop hosting, training facilitation"
        url="https://sessionkit.io/workshop-tips"
      />
      {/* Header */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </section>

      {/* Hero Section */}
      <section className="px-4 py-12 md:py-16 max-w-4xl mx-auto">
        <motion.div
          className="text-center space-y-6"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Workshop Hosting Tips
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practical advice for running engaging sessions, whether you're teaching, training, or facilitating
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Tips Sections */}
      <section className="px-4 py-12 max-w-5xl mx-auto space-y-16">
        {/* Before the Session */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Before the Session</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-1" />
                  <span>Set Clear Objectives</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Know exactly what you want participants to learn or accomplish. Write down 2-3 key takeaways and design your session around them.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-1" />
                  <span>Test Your Tech</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Try Sessionkit tools beforehand. Make sure screen sharing works, QR codes are scannable, and you know how to navigate each tool.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-1" />
                  <span>Plan Your Timing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Build in buffer time. Interactive activities always take longer than expected. A good rule: add 25% more time than you think you need.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-1" />
                  <span>Prepare Backup Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Have offline alternatives ready. Print participant names, prepare manual team assignments, or keep discussion questions handy if tech fails.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* During the Session */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">During the Session</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                  <span>Start with Energy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-3">
                  <p>
                    The first 10 minutes set the tone. Use <strong>Name Roulette</strong> for quick introductions or <strong>Live Poll</strong> to gauge the room's mood. Get people interacting immediately.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    "Who's traveled the furthest to be here today?" → Spin the wheel
                  </p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-violet-500 flex-shrink-0 mt-1" />
                  <span>Mix Up the Groups</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-3">
                  <p>
                    Don't let people stay in comfort zones all day. Use <strong>Squad Scramble</strong> to create different teams for each activity. Fresh perspectives lead to better discussions.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Pro tip: For longer sessions, scramble teams 2-3 times so everyone works with different people.
                  </p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-coral-500 flex-shrink-0 mt-1" />
                  <span>Watch for Energy Dips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-3">
                  <p>
                    Notice when engagement drops (usually after 45-60 minutes). That's your cue to switch activities, take a break, or inject something unexpected.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Quick energy boost: Run a 2-minute Live Poll with a fun question like "Rate your current caffeine level (0-100)."
                  </p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                  <span>Balance Talk and Action</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Follow the 20-80 rule: You talk for 20% of the time, participants are active for 80%. Use tools to facilitate discussions, not replace them.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Tool-Specific Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Tool-Specific Tips</h2>
          </div>

          <div className="space-y-6">
            <Card className="border-coral-200">
              <CardHeader>
                <CardTitle className="text-coral-600">Name Roulette</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-coral-500 flex-shrink-0">•</span>
                    <span><strong>Cold calling made kind:</strong> Use it for questions, but frame it positively. "Who wants to share first?" feels different than singling someone out.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral-500 flex-shrink-0">•</span>
                    <span><strong>Build anticipation:</strong> Let the wheel spin for a few seconds. The drama keeps people engaged.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral-500 flex-shrink-0">•</span>
                    <span><strong>Allow passes:</strong> Let people opt out gracefully if they're not ready. Trust builds participation.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle className="text-teal-600">Squad Scramble</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 flex-shrink-0">•</span>
                    <span><strong>Set clear team sizes:</strong> 3-4 people works best for most activities. Avoid pairs (too limiting) and groups over 6 (free riders).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 flex-shrink-0">•</span>
                    <span><strong>Give teams roles:</strong> After scrambling, assign roles within teams (facilitator, timekeeper, presenter). Structure helps productivity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 flex-shrink-0">•</span>
                    <span><strong>Name the teams:</strong> Let groups pick silly names. It builds team identity and adds fun.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-600">Live Poll</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span><strong>Start with easy questions:</strong> Begin with low-stakes polls ("How's everyone feeling?") before diving into serious topics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span><strong>Pause to discuss:</strong> When you see interesting distributions, hit pause and ask "Why do you think we're split like this?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span><strong>Label your scales clearly:</strong> "Strongly Disagree → Strongly Agree" is clearer than just "0 → 100".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span><strong>Use before/after polls:</strong> Poll at the start of a topic and again at the end. Showing how opinions shifted is powerful.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Common Pitfalls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Common Pitfalls to Avoid</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-red-600">
                  <span className="text-2xl">❌</span>
                  <span>Overusing Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Don't spin the wheel every 5 minutes. Tools should enhance activities, not become the activity. Use them purposefully.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-red-600">
                  <span className="text-2xl">❌</span>
                  <span>Rushing Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Take 30 seconds to explain how a tool works, even if it seems obvious. Confused participants disengage quickly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-red-600">
                  <span className="text-2xl">❌</span>
                  <span>Ignoring the Quiet Ones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Tools can help surface all voices, but you still need to create psychological safety. Check in with quiet participants privately during breaks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-red-600">
                  <span className="text-2xl">❌</span>
                  <span>Skipping the Debrief</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  After using any tool, spend 2-3 minutes discussing what happened. "What did you notice?" turns activity into learning.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-br from-coral-50 to-violet-50 border-2 border-teal-200">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Reference: When to Use What</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-coral-600 mb-1">Name Roulette</p>
                <p className="text-gray-700 text-sm">Icebreakers, selecting volunteers, cold calling, random demonstrations</p>
              </div>
              <div>
                <p className="font-semibold text-teal-600 mb-1">Squad Scramble</p>
                <p className="text-gray-700 text-sm">Group activities, breakout sessions, discussion groups, project teams</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-1">Live Poll</p>
                <p className="text-gray-700 text-sm">Gauging opinions, checking understanding, before/after comparisons, energizing the room</p>
              </div>
              <div>
                <p className="font-semibold text-violet-600 mb-1">Quiz Race</p>
                <p className="text-gray-700 text-sm">Knowledge checks, competitive review, team competitions, gamified learning (coming soon)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-20 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Ready to try these tips in action?
          </h2>
          <p className="text-lg text-gray-600">
            All our tools are free to use. No sign-up required.
          </p>
          <Button size="lg" asChild>
            <Link to="/">Explore Tools</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  )
}

export default WorkshopTipsPage
