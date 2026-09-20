import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

export function PageHeading({
  icon,
  kicker,
  title,
  description,
  actions,
}: {
  icon: IconName;
  kicker: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        <span className="heading-icon">
          <Icon name={icon} size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-brass">{kicker}</p>
          <h1 className="serif text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-ink-soft">{description}</p> : null}
        </div>
      </div>
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
