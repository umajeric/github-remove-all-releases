'use strict';
var Github = require('github');
var Q = require('q');
require('dotenv').config();

var github = new Github({
  version: '3.0.0'
});

function githubRemoveAllReleases(auth, owner, repo, done, filter) {
  if (!auth) {
    throw new Error('Expected an auth object');
  }

  if (typeof owner !== 'string') {
    throw new Error('owner must be a string');
  }

  if (typeof repo !== 'string') {
    throw new Error('repo must be a string');
  }

  if (typeof done !== 'function') {
    throw new Error('Expected a callback');
  }

  if (typeof filter !== 'function') {
    filter = function(tag) {
      console.log (tag.draft);
      return Boolean(tag.draft);
    };
  }

  github.authenticate(auth);

  Q.nfcall(github.releases.listReleases, {
    owner: owner,
    repo: repo,
    per_page: 500
  })
    .then(function(data) {
      var deleteReleasePromises = [];

      if (data.length === 0) {
        throw new Error('No releases found');
      }

      data.forEach(function(release) {
        if (filter(release)) {
          var waitTill = new Date(new Date().getTime() + 1 * 1000);
          while(waitTill > new Date()){}
          deleteReleasePromises.push(Q.nfcall(github.releases.deleteRelease, {
            owner: owner,
            repo: repo,
            id: release.id
          }));
        }
      });

      return Q.allSettled(deleteReleasePromises);
    })
    .then(function(data) {
      setImmediate(done, null, data);
    }, function(err) {
      setImmediate(done, err);
    });
}

var AUTH = {
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
};


githubRemoveAllReleases(AUTH, process.env.GITHUB_OWNER, process.env.GITHUB_REPO, function (err, data) {
    console.log(err, data);
});
