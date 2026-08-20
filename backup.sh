#!/bin/bash
# Used in Tetras Libre environment to backup the database and files. This script is called by a cron job.
DIR=$(dirname $0)
just --justfile "$DIR/justfile" --working-directory "$DIR" mysql_dump
