# Buildpack Build Configuration

## For Google Cloud App Engine / App Hosting

If using buildpacks (which seems to be your case based on the error logs), the issue is that buildpacks use `npm ci` by default.

### Solution 1: Include package-lock.json

Make sure `package-lock.json` is committed to your repository:

```bash
# Generate if missing
npm install

# Check it exists
ls -la package-lock.json

# Commit it
git add package-lock.json
git commit -m "Add package-lock.json for buildpack"
git push
```

### Solution 2: Use .npmrc to configure npm behavior

Create a `.npmrc` file:

```
legacy-peer-deps=true
```

This tells npm to ignore peer dependency conflicts.

### Solution 3: Override buildpack behavior

Create `app.yaml` (if using App Engine):

```yaml
runtime: nodejs18

env_variables:
  NPM_CONFIG_PRODUCTION: 'false'
  NODE_ENV: 'production'

# Force npm install instead of npm ci
build:
  skip_files:
    - ^node_modules$
```

### Solution 4: Use Cloud Build instead of Buildpacks

This is the most reliable option. Use the `cloudbuild.yaml` included in this package:

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

This gives you full control over the build process.
