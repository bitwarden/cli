#!/usr/bin/env bash

# bw git-credential helper
# Based on:
# * https://github.com/lastpass/lastpass-cli/blob/master/contrib/examples/git-credential-lastpass
# * https://gist.github.com/mikeboiko/58ab730afd65bca0a125bc12b6f4670d

# A credential helper for git to retrieve usernames and passwords from bw.
# For general usage, see https://git-scm.com/docs/gitcredentials.
# Here's a quick version:
# 1. Put this somewhere in your path.
# 2. git config --global credential.helper bw

declare -A params

if [[ "$1" == "get" ]]; then
    read -r line
    while [ -n "$line" ]; do
        key=${line%%=*}
        value=${line#*=}
        params[$key]=$value
        read -r line
    done

    if [[ "${params['protocol']}" != "https" ]]; then
        exit
    fi

    if [[ -z "${params["host"]}" ]]; then
        exit
    fi

    if ! bw list items --search "asdf" > /dev/null 2>&1; then
        echo "Please login to Bitwarden to use git credential helper" > /dev/stderr
        exit
    fi

    id=$(bw list items --search "${params["host"]}"|jq ".[] | select(.name == \"${params["host"]}\").id" -r)

    if [[ -z "$id" ]]; then
        echo "Couldn't find item id in Bitwarden DB." > /dev/stderr
        echo "${params}"
        exit
    fi

    user=$(bw get username "${id}")
    pass=$(bw get password "${id}")

    if [[ -z "$user" ]] || [[ -z "$pass" ]]; then
        echo "Couldn't find host in Bitwarden DB." > /dev/stderr
        exit
    fi

    echo username="$user"
    echo password="$pass"
fi
