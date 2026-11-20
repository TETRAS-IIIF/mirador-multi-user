#!/bin/bash
# Used in Tetras Libre environment to backup the database and files. This script is called by a cron job.
DIR=$(dirname $0)
cd $DIR
just mysql_dump
cd -
