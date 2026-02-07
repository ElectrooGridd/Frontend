import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'

export function Welcome() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl font-bold text-text-primary mb-2 text-center">Electrogrid</h1>
      <p className="text-text-secondary text-sm mb-8 text-center">
        Electricity grid and energy recharge
      </p>
      <div className="w-full space-y-3">
        <Link to="/register" className="block">
          <Button fullWidth size="lg">
            Sign up
          </Button>
        </Link>
        <Link to="/login" className="block">
          <Button variant="secondary" fullWidth size="lg" className="border-2 border-primary text-primary bg-white">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  )
}
