import { slugField } from 'payload'

import { slugify } from '@/utilities/slugify'

export const slug = (useAsSlug = 'name') =>
  slugField({
    useAsSlug,
    slugify: ({ valueToSlugify }) => slugify(valueToSlugify),
    overrides: (field) => {
      const [, slugInput] = field.fields
      if (slugInput?.type === 'text') {
        slugInput.label = 'Адреса (slug)'
        // Built-in generation runs after validation, which breaks API creates
        slugInput.hooks = {
          ...slugInput.hooks,
          beforeValidate: [
            ...(slugInput.hooks?.beforeValidate ?? []),
            ({ value, data }) => value || slugify(data?.[useAsSlug]),
          ],
        }
      }
      return field
    },
  })
