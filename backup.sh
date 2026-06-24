#!/bin/bash
# Used in Tetras Libre environment to backup the database and files. This script is called by a cron job.
DIR=$(dirname $0)
$DIR/cli.sh mysql_dump
