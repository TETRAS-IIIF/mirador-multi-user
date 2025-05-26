---
name: Deploy new version
about: Track deployment of a new software version
title: 'Deployment '
labels: deploy
assignees: ''

---

## 🚀 Deploy MMU on Server

Use this template to track and document the deployment

---

### 🔁 Current Commit ID

_The commit ID of the previous version_

```
<insert previous commit ID>
```

---

### ✅ Commit ID Deployed

_The commit ID of the deployed version_

```
<insert new commit ID>
```

---

### 🖥️ Instance

_Instance and server name (e.g., Houston / Larus)_

```
<insert instance/server name>
```

---

### 📦 Deployment Steps

```
1. SSH into the server  
2. Pull latest code from Git  
3. Stop the stack  
4. Build new container  
5. Relaunch  
6. Check `.env` variables (all needed are set)  
7. Run migrations  
```

---

### ✅ Post-deployment Checks

_Steps to verify deployment success:_

- [ ] Application is running  
- [ ] Logs are clean  

# Functionality tested  
## Account 
- [ ] Create account
- [ ] Valid mail
- [ ] Use Forgot password
- [ ] Change password
- [ ] Connect with new password
- [ ] Go to settings
- [ ] Change name
- [ ] Change password
- [ ] Change Mail

## Project
- [ ] Create a project
- [ ] Change name , created date, thumbnail and description of this project
- [ ] Add a user to the project
- [ ] Change right of the user
- [ ] Remove user from project
- [ ] Set Metadata
- [ ] Duplicate Project
- [ ] Delete Project
- [ ] Filter projects
- [ ] Generate a snapShot
- [ ] share snapShot

## Manifest 
- [ ] Create a manifest
- [ ] Change name , created date, thumbnail and description of this manifest
- [ ] Add a user to the manifest
- [ ] Change right of the user
- [ ] Remove user from manifest
- [ ] Set Metadata
- [ ] Duplicate manifest
- [ ] Delete manifest
- [ ] Filter manifest
- [ ] Upload manifest
- [ ] Link manifest 

### Create Manifest

- Add media video and images
- set thumbnail
- change name

### Advances edit mode 

- Change some field in advanced edit

## Media
- [ ] Upload media
- [ ] Link media 
- [ ] Change name , created date, thumbnail and description of this media
- [ ] Add a user to the media
- [ ] Change right of the user
- [ ] Remove user from media
- [ ] Set Metadata
- [ ] Duplicate media
- [ ] Delete media
- [ ] Filter media

## Group 

- [ ] Create a group
- [ ] Change name , created date, thumbnail and description of this group
- [ ] Add a user to the group
- [ ] Change right of the user
- [ ] Remove user from group
