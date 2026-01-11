import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const ToolInfo = ({ sections, color = 'coral' }) => {
  const colorClasses = {
    coral: {
      gradient: 'from-coral-500 to-coral-600',
      icon: 'bg-coral-100 text-coral-600',
      border: 'border-coral-200',
    },
    teal: {
      gradient: 'from-teal-500 to-teal-600',
      icon: 'bg-teal-100 text-teal-600',
      border: 'border-teal-200',
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
    },
  }

  const colors = colorClasses[color] || colorClasses.coral

  return (
    <div className="tool-info-section" style={{ background: '#f8f9fa', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            style={{ marginBottom: index < sections.length - 1 ? '4rem' : 0 }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div
                className={`bg-gradient-to-br ${colors.gradient}`}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                {section.icon}
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a202c', margin: 0 }}>
                {section.title}
              </h2>
            </div>

            {/* Section Content */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: section.columns === 1 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {section.items.map((item, itemIndex) => (
                <Card key={itemIndex} className={colors.border}>
                  <CardHeader>
                    <CardTitle className="flex items-start gap-3">
                      {item.icon && (
                        <span
                          className={colors.icon}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base" style={{ color: '#4a5568' }}>
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ToolInfo
