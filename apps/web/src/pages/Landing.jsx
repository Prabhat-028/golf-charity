import { Link } from 'react-router'
import { CheckCircle, Trophy, Heart, Target } from 'lucide-react'
import Button from '@/components/ui/Button'

const features = [
  {
    icon: Target,
    title: 'Submit Your Scores',
    description: 'Enter your 5 best Stableford golf scores (1-45 points each) to participate in monthly draws.',
  },
  {
    icon: Trophy,
    title: 'Win Prizes',
    description: 'Match 3, 4, or all 5 numbers in our monthly draw to win from the prize pool.',
  },
  {
    icon: Heart,
    title: 'Support Charities',
    description: '10% of all subscriptions go directly to golf-related charities making a real difference.',
  },
]

const plans = [
  {
    name: 'Monthly',
    price: '$9.99',
    interval: 'per month',
    features: ['5 score entries', 'Monthly draw entry', 'Support charities', 'Cancel anytime'],
  },
  {
    name: 'Yearly',
    price: '$99',
    interval: 'per year',
    popular: true,
    features: ['5 score entries', 'Monthly draw entry', 'Support charities', 'Save $20 per year', 'Priority support'],
  },
]

export default function Landing() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Turn Your Golf Scores Into{' '}
              <span className="text-primary-200">Winning Numbers</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Subscribe, submit your Stableford scores, and enter monthly draws
              for a chance to win cash prizes while supporting charities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100 w-full sm:w-auto">
                  Start Playing
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="!border-white !bg-white/10 !text-white hover:!bg-white/20 w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50" />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, fun, and rewarding. Join thousands of golfers supporting charities while playing for prizes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Distribution */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Prize Distribution</h2>
            <p className="text-lg text-gray-600">Match numbers from the monthly draw to win big.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="text-4xl font-bold text-yellow-600 mb-2">40%</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">5 Number Match</div>
              <p className="text-gray-600 text-sm">Match all 5 numbers</p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-4xl font-bold text-gray-700 mb-2">35%</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">4 Number Match</div>
              <p className="text-gray-600 text-sm">Match any 4 numbers</p>
            </div>
            <div className="text-center p-8 rounded-xl bg-orange-50 border border-orange-200">
              <div className="text-4xl font-bold text-orange-600 mb-2">25%</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">3 Number Match</div>
              <p className="text-gray-600 text-sm">Match any 3 numbers</p>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8">
            Plus, 10% of all subscriptions go directly to charity.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that works for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`
                  relative bg-white rounded-xl p-8 shadow-sm
                  ${plan.popular ? 'border-2 border-primary-500 ring-4 ring-primary-50' : 'border border-gray-100'}
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.interval.split(' ')[1]}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'primary' : 'outline'}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join our community of golfers making a difference while playing for prizes.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100">
              Subscribe Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
