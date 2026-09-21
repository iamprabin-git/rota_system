import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

export function PageHeading({
  icon,
  kicker,
  title,
  description,
  actions,
}: {
  icon?: IconName;
  kicker?: string;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      {title ? (
        <div className="page-heading-copy">
          {icon ? (
            <span className="heading-icon">
              <Icon name={icon} size={22} />
            </span>
          ) : null}
          <div className="min-w-0">
            {kicker ? <p className="text-xs uppercase tracking-[0.2em] text-brass">{kicker}</p> : null}
            <h1 className="serif text-4xl">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-ink-soft">{description}</p> : null}
          </div>
        </div>
      ) : description ? (
        <p className="max-w-2xl text-ink-soft">{description}</p>
      ) : (
        <span />
      )}
      {actions ? <div className="page-heading-actions">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span className="heading-icon compact">
        <Icon name={icon} size={16} />
      </span>
      <div>
        <h2 className="serif text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      </div>
    </div>
  );
}
