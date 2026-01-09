import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import SEO from './SEO'
import {
  Sparkles,
  Users,
  Zap,
  Trophy,
  Heart,
  Gauge,
  Globe,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  BarChart3
} from 'lucide-react'

const LandingPage = () => {
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
      <SEO />
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 lg:py-32 max-w-7xl mx-auto">
        <motion.div
          className="text-center space-y-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900">
              Engaging tools for{' '}
              <span className="bg-gradient-to-r from-coral-500 via-teal-500 to-violet-500 bg-clip-text text-transparent">
                any session
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Spin wheels. Form teams. Run quizzes. Gather opinions.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Get everyone participating in meetings, classes, and workshops. Simple tools built for interaction.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="xl" className="whitespace-nowrap" asChild>
              <Link to="/nameroulette" className="flex items-center justify-center gap-2">
                <span>Get started</span>
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-sm text-gray-500">
            Used by teachers, trainers, and facilitators worldwide
          </motion.p>
        </motion.div>
      </section>

      {/* Tools Showcase Section */}
      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Name Roulette */}
          <motion.div variants={fadeInUp}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-coral-200 hover:border-coral-400 group flex flex-col">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-coral-100 flex items-center justify-center group-hover:bg-coral-500 transition-colors">
                  <Sparkles className="h-8 w-8 text-coral-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <Badge variant="coral" className="mb-3">Name Roulette</Badge>
                  <CardTitle className="text-2xl">Pick names fairly (and dramatically)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <CardDescription className="text-base flex-grow">
                  Random name selection with a fun spin - perfect for cold calls and team picks
                </CardDescription>
                <Button variant="coral" className="w-full flex-nowrap mt-auto" size="lg" asChild>
                  <Link to="/nameroulette" className="flex items-center justify-center gap-2 no-underline">
                    Spin the wheel
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Squad Scramble */}
          <motion.div variants={fadeInUp}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-teal-200 hover:border-teal-400 group flex flex-col">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                  <Users className="h-8 w-8 text-teal-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <Badge variant="teal" className="mb-3">Squad Scramble</Badge>
                  <CardTitle className="text-2xl">Create random teams instantly</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <CardDescription className="text-base flex-grow">
                  Split any group into balanced teams in seconds
                </CardDescription>
                <Button variant="teal" className="w-full flex-nowrap mt-auto" size="lg" asChild>
                  <Link to="/squadscramble" className="flex items-center justify-center gap-2 no-underline">
                    Generate teams
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Race */}
          <motion.div variants={fadeInUp}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-violet-200 hover:border-violet-400 group flex flex-col">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                  <Trophy className="h-8 w-8 text-violet-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <Badge variant="violet" className="mb-3">Quiz Race</Badge>
                  <CardTitle className="text-2xl">Turn any quiz into a competition</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <CardDescription className="text-base flex-grow">
                  Live quiz competitions that get everyone involved
                </CardDescription>
                <Button variant="violet" className="w-full flex-nowrap mt-auto" size="lg" disabled>
                  Coming soon
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Poll */}
          <motion.div variants={fadeInUp}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-blue-200 hover:border-blue-400 group flex flex-col">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <BarChart3 className="h-8 w-8 text-blue-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <Badge variant="default" className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-200">Live Poll</Badge>
                  <CardTitle className="text-2xl">Gather opinions in real-time</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <CardDescription className="text-base flex-grow">
                  Instant polling with live distribution curves - see responses as they come in
                </CardDescription>
                <Button className="w-full flex-nowrap mt-auto bg-blue-500 hover:bg-blue-600" size="lg" asChild>
                  <Link to="/live-poll" className="flex items-center justify-center gap-2 no-underline">
                    Start polling
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Use Cases Section */}
      <section className="px-4 py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Perfect for every session
            </h2>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Heart,
                title: "Break the ice",
                description: "Start sessions with energy using Name Roulette"
              },
              {
                icon: Users,
                title: "Form balanced teams",
                description: "Create fair groups for activities and projects"
              },
              {
                icon: CheckCircle2,
                title: "Check understanding",
                description: "Run quick knowledge checks with Quiz Race"
              },
              {
                icon: Zap,
                title: "Energize meetings",
                description: "Keep everyone engaged and participating"
              },
              {
                icon: Sparkles,
                title: "Teach interactively",
                description: "Make learning active and memorable"
              },
              {
                icon: Trophy,
                title: "Run workshops",
                description: "Facilitate group activities with ease"
              }
            ].map((useCase, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-coral-500 via-teal-500 to-violet-500 flex items-center justify-center mb-3">
                      <useCase.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{useCase.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Sessionkit?
          </h2>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            {
              icon: Gauge,
              title: "Simple & Fast",
              description: "No sign-up required. Open and start using immediately"
            },
            {
              icon: Zap,
              title: "Modern & Reliable",
              description: "Built with the latest web technologies for smooth performance"
            },
            {
              icon: Globe,
              title: "Works Anywhere",
              description: "Fully responsive on phones, tablets, and computers"
            },
            {
              icon: DollarSign,
              title: "Free to get started",
              description: "Core tools remain free for facilitators everywhere"
            }
          ].map((benefit, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-500 via-teal-500 to-violet-500 flex items-center justify-center mx-auto">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get started in seconds
            </h2>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                step: "1",
                title: "Choose your tool",
                description: "Pick from Name Roulette, Squad Scramble, or Quiz Race"
              },
              {
                step: "2",
                title: "Set it up",
                description: "Add your names, set team sizes, or create your quiz"
              },
              {
                step: "3",
                title: "Engage your audience",
                description: "Share your screen or send the link to participants"
              }
            ].map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral-500 via-teal-500 to-violet-500 flex items-center justify-center mx-auto text-2xl font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-coral-300 via-teal-300 to-violet-300" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 md:py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ready to make your sessions more engaging?
          </h2>
          <p className="text-xl text-gray-600">
            Try any of our free tools now
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center flex-wrap">
            <Button variant="coral" size="lg" className="whitespace-nowrap min-w-[160px]" asChild>
              <Link to="/nameroulette">Name Roulette</Link>
            </Button>
            <Button variant="teal" size="lg" className="whitespace-nowrap min-w-[160px]" asChild>
              <Link to="/squadscramble">Squad Scramble</Link>
            </Button>
            <Button variant="violet" size="lg" className="whitespace-nowrap min-w-[160px]" asChild>
              <Link to="/quizrace">Quiz Race</Link>
            </Button>
            <Button size="lg" className="whitespace-nowrap min-w-[160px] bg-blue-500 hover:bg-blue-600" asChild>
              <Link to="/live-poll">Live Poll</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2025 Sessionkit. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/workshop-tips" className="text-gray-600 hover:text-gray-900 transition-colors">Workshop Tips</Link>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
