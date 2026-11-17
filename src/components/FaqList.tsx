import { useId, useState } from 'react'
import { Plus } from 'lucide-react'

type FaqListProps = {
  items: string[][]
}

export function FaqList({ items }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className="mt-2 flex flex-col divide-y divide-ink/10 border-t border-ink/10">
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index
        const buttonId = `${baseId}-q-${index}`
        const panelId = `${baseId}-a-${index}`
        return (
          <div key={question} className="py-4 sm:py-5">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 text-left text-base font-bold text-ink transition-colors hover:text-primary sm:gap-6"
              >
                {question}
                <Plus
                  aria-hidden
                  size={18}
                  className={`shrink-0 text-muted transition-[transform,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-primary ${isOpen ? 'rotate-45 text-primary' : ''}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="max-w-prose pr-8 pt-3 text-pretty text-base leading-[1.7] text-muted">{answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
