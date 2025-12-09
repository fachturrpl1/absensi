import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface WizardStep {
  number: number
  title: string
  description?: string
}

interface WizardProps {
  steps: WizardStep[]
  currentStep: number
  children: React.ReactNode
  onNext?: () => void
  onPrevious?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  showNavigation?: boolean
  className?: string
}

export function Wizard({
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  showNavigation = true,
  className,
}: WizardProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Progress Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all relative z-10",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 -mt-5 relative z-0",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-card rounded-lg border shadow-sm p-6 min-h-[400px] flex flex-col">
        {/* Content Area */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Footer with Step Counter and Navigation */}
        {showNavigation && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            {/* Step Counter */}
            <div className="text-sm text-muted-foreground">
              <span className="underline">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {onPrevious && currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                >
                  Back
                </Button>
              )}
              {onNext && currentStep < steps.length && (
                <Button
                  onClick={onNext}
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

