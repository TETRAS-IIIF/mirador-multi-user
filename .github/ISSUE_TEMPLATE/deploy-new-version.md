---
name: Deploy new version
about: Track deployment of a new software version
title: 'Deployment '
labels: deploy
assignees: ''

---

body:
  - type: markdown
    attributes:
      value: |
        ## 🚀 Deploy on Server

        Use this template to track and document the deployment of software to a specific server.

  - type: input
    id: old-version
    attributes:
      label: Current commit id
      description: The commit id of previous version
      placeholder: 
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Commit id deployed
      description: The commit id of deployed version
      placeholder:
    validations:
      required: true

  - type: input
    id: instance
    attributes:
      label: Instance
      description: Instance and server name 
      placeholder: Houston / Larus
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Deployment Steps
      description: Describe the steps to deploy the application
      placeholder: |
        1. SSH into the server
        2. Pull latest code from Git
        3. Stop the stack 
        4. Build new container
        5. Relaunch
        6. Check .env variable (all needed are set)
        7. Migration
    validations:
      required: true

  - type: textarea
    id: post_deploy
    attributes:
      label: Post-deployment Checks
      description: Steps to verify deployment success
      placeholder: |
        - [ ] Application is running
        - [ ] Logs are clean
        - [ ] Functionality tested :
        - [ ] TODO include https://github.com/TETRAS-IIIF/mirador-multi-user/issues/322
    validations:
      required: true
