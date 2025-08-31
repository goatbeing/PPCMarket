import React, { useState } from 'react'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { FiSearch, FiTrendingUp, FiClock, FiShield } from 'react-icons/fi'

const IndexPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <Layout
      title="ENS Marketplace - Trade Domains Safely"
      description="Buy and sell ENS domains with confidence. Secure, decentralized marketplace powered by Seaport protocol."
      canonicalUrl="https://marketplace.ens.domains/"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Trade ENS Domains
              <span className="block text-primary">with Confidence</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-12">
              The safest way to buy and sell ENS domains on Ethereum.
              Powered by Seaport protocol with built-in security and trustless execution.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search for ENS domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-14 pr-4 py-4 text-lg w-full"
                />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary px-8 py-4 text-lg">
                Browse Listings
              </button>
              <button className="btn btn-secondary px-8 py-4 text-lg">
                List Your Domain
              </button>
            </div>
          </motion.div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(41,151,255,0.1),transparent_50%)]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Choose ENS Marketplace?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Built on proven technology with security and user experience as top priorities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="card card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiShield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Secure by Design</h3>
              <p className="text-text-secondary">
                Every transaction is secured by Ethereum smart contracts.
                No intermediaries, no counterparty risk.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="card card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiTrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Best Prices</h3>
              <p className="text-text-secondary">
                Competitive marketplace with transparent pricing.
                Buy and sell with confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="card card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiClock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Fast Settlement</h3>
              <p className="text-text-secondary">
                Instant execution on Ethereum.
                No waiting periods or holding times.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-text-secondary">Domains Listed</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">$2.5M</div>
              <div className="text-text-secondary">Volume Traded</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5K+</div>
              <div className="text-text-secondary">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-text-secondary">Uptime</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Trade?
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join thousands of users trading ENS domains securely on Ethereum.
            </p>
            <button className="btn btn-primary px-8 py-4 text-lg">
              Get Started
            </button>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}

export default IndexPage
